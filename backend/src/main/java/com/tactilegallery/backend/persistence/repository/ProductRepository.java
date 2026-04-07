package com.tactilegallery.backend.persistence.repository;

import com.tactilegallery.backend.persistence.entity.ProductEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<ProductEntity, Long> {

    List<ProductEntity> findAllByOrderByIdAsc();

    Optional<ProductEntity> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySkuIgnoreCase(String sku);
}
