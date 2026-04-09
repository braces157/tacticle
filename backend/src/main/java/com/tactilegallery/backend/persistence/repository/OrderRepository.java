package com.tactilegallery.backend.persistence.repository;

import com.tactilegallery.backend.persistence.entity.OrderEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<OrderEntity, Long> {

    List<OrderEntity> findAllByOrderByCreatedAtDesc();

    List<OrderEntity> findByUser_ExternalIdOrderByCreatedAtDesc(String externalId);

    Optional<OrderEntity> findByOrderNumber(String orderNumber);

    @Query(value = "select next value for dbo.order_number_sequence", nativeQuery = true)
    Long nextOrderNumberValue();

    @Query("""
        select case when count(orderItem) > 0 then true else false end
        from OrderItemEntity orderItem
        where orderItem.order.user.externalId = :externalId
          and orderItem.productSlug = :productSlug
    """)
    boolean hasPurchasedProduct(@Param("externalId") String externalId, @Param("productSlug") String productSlug);
}
