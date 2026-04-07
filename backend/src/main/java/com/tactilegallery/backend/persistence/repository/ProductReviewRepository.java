package com.tactilegallery.backend.persistence.repository;

import com.tactilegallery.backend.persistence.entity.ProductReviewEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductReviewRepository extends JpaRepository<ProductReviewEntity, Long> {

    List<ProductReviewEntity> findByProduct_SlugAndStatusOrderByCreatedAtDesc(String productSlug, String status);

    List<ProductReviewEntity> findByProduct_SlugOrderByCreatedAtDesc(String productSlug);

    List<ProductReviewEntity> findByStatusOrderByCreatedAtDesc(String status);

    List<ProductReviewEntity> findAllByOrderByCreatedAtDesc();

    boolean existsByProduct_SlugAndUser_ExternalId(String productSlug, String externalId);
}
