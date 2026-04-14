package com.tactilegallery.backend.config;

import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tactilegallery.backend.model.DomainModels;
import java.time.Duration;
import java.util.Map;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

@Configuration
public class RedisCacheConfig {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory, ObjectMapper objectMapper) {
        RedisCacheConfiguration defaults = RedisCacheConfiguration.defaultCacheConfig()
            .disableCachingNullValues()
            .entryTtl(Duration.ofMinutes(10))
            .computePrefixWith(cacheName -> "tactile-gallery::" + cacheName + "::");

        Map<String, RedisCacheConfiguration> cacheConfigurations = Map.of(
            CacheNames.CATEGORIES,
            configWithTypedSerializer(defaults, objectMapper, listType(objectMapper, DomainModels.Category.class), Duration.ofHours(1)),
            CacheNames.CATEGORY_BY_SLUG,
            configWithTypedSerializer(defaults, objectMapper, objectMapper.constructType(DomainModels.Category.class), Duration.ofHours(1)),
            CacheNames.FEATURED_PRODUCTS,
            configWithTypedSerializer(defaults, objectMapper, listType(objectMapper, DomainModels.ProductSummary.class), Duration.ofMinutes(15)),
            CacheNames.PRODUCTS_BY_CATEGORY,
            configWithTypedSerializer(defaults, objectMapper, listType(objectMapper, DomainModels.ProductSummary.class), Duration.ofMinutes(15)),
            CacheNames.PRODUCT_DETAILS,
            configWithTypedSerializer(defaults, objectMapper, objectMapper.constructType(DomainModels.ProductDetail.class), Duration.ofMinutes(15)),
            CacheNames.RELATED_PRODUCTS,
            configWithTypedSerializer(defaults, objectMapper, listType(objectMapper, DomainModels.ProductSummary.class), Duration.ofMinutes(15)),
            CacheNames.PRODUCT_SEARCH,
            configWithTypedSerializer(defaults, objectMapper, listType(objectMapper, DomainModels.ProductSummary.class), Duration.ofMinutes(5)),
            CacheNames.APPROVED_REVIEWS,
            configWithTypedSerializer(defaults, objectMapper, listType(objectMapper, DomainModels.ProductReview.class), Duration.ofMinutes(10))
        );

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(defaults)
            .withInitialCacheConfigurations(cacheConfigurations)
            .transactionAware()
            .build();
    }

    private RedisCacheConfiguration configWithTypedSerializer(
        RedisCacheConfiguration defaults,
        ObjectMapper objectMapper,
        JavaType javaType,
        Duration ttl
    ) {
        Jackson2JsonRedisSerializer<Object> serializer = new Jackson2JsonRedisSerializer<>(objectMapper, javaType);
        return defaults.entryTtl(ttl)
            .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(serializer));
    }

    private JavaType listType(ObjectMapper objectMapper, Class<?> elementType) {
        return objectMapper.getTypeFactory().constructCollectionType(java.util.List.class, elementType);
    }
}
