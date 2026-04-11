package com.tactilegallery.backend.controller;

import com.tactilegallery.backend.dto.ApiRequests;
import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.service.ChatService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/threads")
    public List<DomainModels.ChatThreadSummary> getThreads() {
        return chatService.getCurrentUserThreads();
    }

    @GetMapping("/threads/product/{productSlug}")
    public DomainModels.ChatThreadDetail getProductThread(@PathVariable String productSlug) {
        DomainModels.ChatThreadDetail thread = chatService.getCurrentUserProductThread(productSlug);
        if (thread == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Chat thread not found.");
        }
        return thread;
    }

    @GetMapping("/threads/{threadId}")
    public DomainModels.ChatThreadDetail getThread(@PathVariable Long threadId) {
        return chatService.getThreadDetail(threadId);
    }

    @PostMapping("/threads")
    @ResponseStatus(HttpStatus.CREATED)
    public DomainModels.ChatThreadSummary createThread(
        @Valid @RequestBody ApiRequests.CreateChatThreadRequest request
    ) {
        return chatService.createThread(request);
    }

    @PostMapping("/threads/{threadId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public DomainModels.ChatMessage createMessage(
        @PathVariable Long threadId,
        @Valid @RequestBody ApiRequests.CreateChatMessageRequest request
    ) {
        return chatService.createMessage(threadId, request.body());
    }
}
