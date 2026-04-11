package com.tactilegallery.backend.persistence.repository;

import com.tactilegallery.backend.persistence.entity.ChatThreadEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatThreadRepository extends JpaRepository<ChatThreadEntity, Long> {

    @EntityGraph(attributePaths = {"customer", "product"})
    @Query("""
        select t from ChatThreadEntity t
        where t.customer.externalId = :customerExternalId
        order by coalesce(t.lastMessageAt, t.createdAt) desc, t.id desc
        """)
    List<ChatThreadEntity> findForCustomer(@Param("customerExternalId") String customerExternalId);

    @EntityGraph(attributePaths = {"customer", "product"})
    @Query("""
        select t from ChatThreadEntity t
        order by coalesce(t.lastMessageAt, t.createdAt) desc, t.id desc
        """)
    List<ChatThreadEntity> findForAdmin();

    @EntityGraph(attributePaths = {"customer", "product"})
    Optional<ChatThreadEntity> findFirstByCustomer_ExternalIdAndProduct_SlugOrderByUpdatedAtDescIdDesc(
        String customerExternalId,
        String productSlug
    );

    @Query("""
        select distinct t from ChatThreadEntity t
        left join fetch t.customer
        left join fetch t.product
        left join fetch t.messages m
        left join fetch m.sender
        where t.id = :threadId
        """)
    Optional<ChatThreadEntity> findDetailById(@Param("threadId") Long threadId);
}
