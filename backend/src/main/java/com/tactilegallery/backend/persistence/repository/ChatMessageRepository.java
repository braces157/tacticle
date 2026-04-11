package com.tactilegallery.backend.persistence.repository;

import com.tactilegallery.backend.persistence.entity.ChatMessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageRepository extends JpaRepository<ChatMessageEntity, Long> {
}
