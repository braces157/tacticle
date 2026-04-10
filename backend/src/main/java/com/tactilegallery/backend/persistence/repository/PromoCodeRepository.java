package com.tactilegallery.backend.persistence.repository;

import com.tactilegallery.backend.persistence.entity.PromoCodeEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface PromoCodeRepository extends JpaRepository<PromoCodeEntity, Long> {

    Optional<PromoCodeEntity> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    List<PromoCodeEntity> findAllByOrderByCreatedAtDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select promo
        from PromoCodeEntity promo
        where lower(promo.code) = lower(:code)
    """)
    Optional<PromoCodeEntity> findByCodeIgnoreCaseForUpdate(@Param("code") String code);
}
