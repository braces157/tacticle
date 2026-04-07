package com.tactilegallery.backend.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "categories", schema = "dbo")
public class CategoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String slug;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 120)
    private String kicker;

    @Column(nullable = false, length = 255)
    private String headline;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(nullable = false, length = 2000)
    private String story;

    @Column(name = "hero_image_src", nullable = false, length = 1000)
    private String heroImageSrc;

    @Column(name = "hero_image_alt", nullable = false, length = 255)
    private String heroImageAlt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getKicker() {
        return kicker;
    }

    public void setKicker(String kicker) {
        this.kicker = kicker;
    }

    public String getHeadline() {
        return headline;
    }

    public void setHeadline(String headline) {
        this.headline = headline;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStory() {
        return story;
    }

    public void setStory(String story) {
        this.story = story;
    }

    public String getHeroImageSrc() {
        return heroImageSrc;
    }

    public void setHeroImageSrc(String heroImageSrc) {
        this.heroImageSrc = heroImageSrc;
    }

    public String getHeroImageAlt() {
        return heroImageAlt;
    }

    public void setHeroImageAlt(String heroImageAlt) {
        this.heroImageAlt = heroImageAlt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
