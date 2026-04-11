package com.tactilegallery.backend.controller;

import com.tactilegallery.backend.dto.ApiRequests;
import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.service.ChatService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/chat")
public class AdminChatController {

    private final ChatService chatService;

    public AdminChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/threads")
    public List<DomainModels.ChatThreadSummary> getThreads() {
        return chatService.getAdminThreads();
    }

    @GetMapping("/threads/{threadId}")
    public DomainModels.ChatThreadDetail getThread(@PathVariable Long threadId) {
        return chatService.getAdminThreadDetail(threadId);
    }

    @PutMapping("/threads/{threadId}/status")
    public DomainModels.ChatThreadSummary updateStatus(
        @PathVariable Long threadId,
        @Valid @RequestBody ApiRequests.UpdateChatThreadStatusRequest request
    ) {
        return chatService.updateThreadStatus(threadId, request.status());
    }
}
