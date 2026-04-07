package com.tactilegallery.backend.persistence.repository;

import com.tactilegallery.backend.persistence.entity.AppUserEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppUserRepository extends JpaRepository<AppUserEntity, Long> {

    @EntityGraph(attributePaths = {"profile", "profile.preferences"})
    List<AppUserEntity> findAllByRoleIgnoreCaseOrderByCreatedAtDesc(String role);

    Optional<AppUserEntity> findByExternalId(String externalId);

    Optional<AppUserEntity> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    @EntityGraph(attributePaths = {"profile", "profile.preferences"})
    @Query("select u from AppUserEntity u where u.externalId = :externalId")
    Optional<AppUserEntity> findWithProfileByExternalId(@Param("externalId") String externalId);
}
