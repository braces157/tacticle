package com.tactilegallery.backend.service;

import com.tactilegallery.backend.dto.ApiRequests;
import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.persistence.entity.AppUserEntity;
import com.tactilegallery.backend.persistence.entity.ChatMessageEntity;
import com.tactilegallery.backend.persistence.entity.ChatThreadEntity;
import com.tactilegallery.backend.persistence.entity.ProductEntity;
import com.tactilegallery.backend.persistence.repository.AppUserRepository;
import com.tactilegallery.backend.persistence.repository.ChatMessageRepository;
import com.tactilegallery.backend.persistence.repository.ChatThreadRepository;
import com.tactilegallery.backend.persistence.repository.ProductRepository;
import com.tactilegallery.backend.security.AuthenticatedUser;
import com.tactilegallery.backend.security.CurrentUserService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ChatService {

    private final ChatThreadRepository chatThreadRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final AppUserRepository appUserRepository;
    private final ProductRepository productRepository;
    private final CurrentUserService currentUserService;
    private final SqlDomainMapper mapper;
    private final ChatRealtimeBroker chatRealtimeBroker;

    public ChatService(
        ChatThreadRepository chatThreadRepository,
        ChatMessageRepository chatMessageRepository,
        AppUserRepository appUserRepository,
        ProductRepository productRepository,
        CurrentUserService currentUserService,
        SqlDomainMapper mapper,
        ChatRealtimeBroker chatRealtimeBroker
    ) {
        this.chatThreadRepository = chatThreadRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.appUserRepository = appUserRepository;
        this.productRepository = productRepository;
        this.currentUserService = currentUserService;
        this.mapper = mapper;
        this.chatRealtimeBroker = chatRealtimeBroker;
    }

    @Transactional(readOnly = true)
    public List<DomainModels.ChatThreadSummary> getCurrentUserThreads() {
        AuthenticatedUser currentUser = currentUserService.getRequiredUser();
        return chatThreadRepository.findForCustomer(currentUser.userId()).stream()
            .map(mapper::toChatThreadSummary)
            .toList();
    }

    @Transactional(readOnly = true)
    public DomainModels.ChatThreadDetail getCurrentUserProductThread(String productSlug) {
        AuthenticatedUser currentUser = currentUserService.getRequiredUser();
        ChatThreadEntity thread = chatThreadRepository
            .findFirstByCustomer_ExternalIdAndProduct_SlugOrderByUpdatedAtDescIdDesc(currentUser.userId(), productSlug)
            .flatMap(existing -> chatThreadRepository.findDetailById(existing.getId()))
            .orElse(null);

        return thread == null ? null : mapper.toChatThreadDetail(thread);
    }

    @Transactional(readOnly = true)
    public DomainModels.ChatThreadDetail getThreadDetail(Long threadId) {
        AuthenticatedUser currentUser = currentUserService.getRequiredUser();
        ChatThreadEntity thread = loadThreadDetail(threadId);
        assertCanAccessThread(thread, currentUser);
        return mapper.toChatThreadDetail(thread);
    }

    @Transactional
    public DomainModels.ChatThreadSummary createThread(ApiRequests.CreateChatThreadRequest request) {
        AuthenticatedUser currentUser = currentUserService.getRequiredUser();
        if (currentUser.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admins cannot create customer support threads.");
        }

        AppUserEntity customer = requireEnabledUser(currentUser.userId());
        ProductEntity product = resolveProduct(request.productSlug());
        if (product != null) {
            ChatThreadEntity existing = chatThreadRepository
                .findFirstByCustomer_ExternalIdAndProduct_SlugOrderByUpdatedAtDescIdDesc(currentUser.userId(), product.getSlug())
                .orElse(null);
            if (existing != null) {
                return mapper.toChatThreadSummary(existing);
            }
        }

        LocalDateTime now = LocalDateTime.now();
        ChatThreadEntity thread = new ChatThreadEntity();
        thread.setCustomer(customer);
        thread.setProduct(product);
        thread.setSubject(resolveSubject(product, request.subject()));
        thread.setStatus("OPEN");
        thread.setCreatedAt(now);
        thread.setUpdatedAt(now);

        ChatThreadEntity saved = chatThreadRepository.save(thread);
        DomainModels.ChatThreadSummary summary = mapper.toChatThreadSummary(saved);
        chatRealtimeBroker.broadcastThreadUpdated(summary);
        return summary;
    }

    @Transactional
    public DomainModels.ChatMessage createMessage(Long threadId, String body) {
        AuthenticatedUser currentUser = currentUserService.getRequiredUser();
        return sendMessageFromUser(currentUser, threadId, body);
    }

    @Transactional(readOnly = true)
    public List<DomainModels.ChatThreadSummary> getAdminThreads() {
        return chatThreadRepository.findForAdmin().stream()
            .map(mapper::toChatThreadSummary)
            .toList();
    }

    @Transactional(readOnly = true)
    public DomainModels.ChatThreadDetail getAdminThreadDetail(Long threadId) {
        ChatThreadEntity thread = loadThreadDetail(threadId);
        return mapper.toChatThreadDetail(thread);
    }

    @Transactional
    public DomainModels.ChatThreadSummary updateThreadStatus(Long threadId, String requestedStatus) {
        AuthenticatedUser currentUser = currentUserService.getRequiredUser();
        if (!currentUser.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can update chat thread status.");
        }

        ChatThreadEntity thread = chatThreadRepository.findById(threadId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chat thread not found."));
        String normalizedStatus = normalizeStatus(requestedStatus);
        thread.setStatus(normalizedStatus);
        thread.setUpdatedAt(LocalDateTime.now());
        DomainModels.ChatThreadSummary summary = mapper.toChatThreadSummary(thread);
        chatRealtimeBroker.broadcastThreadUpdated(summary);
        return summary;
    }

    @Transactional
    public DomainModels.ChatMessage sendMessageFromSocket(
        AuthenticatedUser authenticatedUser,
        Long threadId,
        String body
    ) {
        return sendMessageFromUser(authenticatedUser, threadId, body);
    }

    private DomainModels.ChatMessage sendMessageFromUser(
        AuthenticatedUser authenticatedUser,
        Long threadId,
        String body
    ) {
        String normalizedBody = normalizeMessage(body);
        AppUserEntity sender = requireEnabledUser(authenticatedUser.userId());
        ChatThreadEntity thread = chatThreadRepository.findById(threadId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chat thread not found."));
        assertCanAccessThread(thread, authenticatedUser);
        if ("CLOSED".equals(thread.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This chat is closed.");
        }

        LocalDateTime now = LocalDateTime.now();
        ChatMessageEntity message = new ChatMessageEntity();
        message.setThread(thread);
        message.setSender(sender);
        message.setBody(normalizedBody);
        message.setCreatedAt(now);
        chatMessageRepository.save(message);

        thread.setLastMessageAt(now);
        thread.setLastMessagePreview(preview(normalizedBody));
        thread.setLastMessageSenderRole(sender.getRole());
        thread.setUpdatedAt(now);

        DomainModels.ChatMessage payload = mapper.toChatMessage(message);
        DomainModels.ChatThreadSummary threadSummary = mapper.toChatThreadSummary(thread);
        chatRealtimeBroker.broadcastMessageCreated(threadSummary, payload);
        return payload;
    }

    private ChatThreadEntity loadThreadDetail(Long threadId) {
        return chatThreadRepository.findDetailById(threadId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chat thread not found."));
    }

    private ProductEntity resolveProduct(String productSlug) {
        String normalizedSlug = trimToEmpty(productSlug);
        if (normalizedSlug.isBlank()) {
            return null;
        }

        return productRepository.findBySlug(normalizedSlug)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found."));
    }

    private AppUserEntity requireEnabledUser(String externalId) {
        return appUserRepository.findByExternalId(externalId)
            .filter(AppUserEntity::isEnabled)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found."));
    }

    private void assertCanAccessThread(ChatThreadEntity thread, AuthenticatedUser authenticatedUser) {
        if (authenticatedUser.isAdmin()) {
            return;
        }
        if (thread.getCustomer().getExternalId().equals(authenticatedUser.userId())) {
            return;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this chat thread.");
    }

    private String resolveSubject(ProductEntity product, String subject) {
        if (product != null) {
            return product.getName() + " support";
        }

        String normalizedSubject = trimToEmpty(subject);
        return normalizedSubject.isBlank() ? "General support" : clip(normalizedSubject, 255);
    }

    private String normalizeMessage(String body) {
        String normalizedBody = trimToEmpty(body);
        if (normalizedBody.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message body is required.");
        }

        return clip(normalizedBody, 4000);
    }

    private String normalizeStatus(String requestedStatus) {
        String normalized = trimToEmpty(requestedStatus).toUpperCase(Locale.ROOT);
        if ("OPEN".equals(normalized) || "CLOSED".equals(normalized)) {
            return normalized;
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported chat thread status.");
    }

    private String preview(String body) {
        return clip(body.replaceAll("\\s+", " "), 140);
    }

    private String clip(String value, int maxLength) {
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}
