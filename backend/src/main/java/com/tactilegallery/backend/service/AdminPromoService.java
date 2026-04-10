package com.tactilegallery.backend.service;

import com.tactilegallery.backend.dto.ApiRequests;
import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.persistence.entity.PromoCodeEntity;
import com.tactilegallery.backend.persistence.repository.PromoCodeRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminPromoService {

    private final PromoCodeRepository promoCodeRepository;
    private final SqlDomainMapper mapper;

    public AdminPromoService(PromoCodeRepository promoCodeRepository, SqlDomainMapper mapper) {
        this.promoCodeRepository = promoCodeRepository;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<DomainModels.AdminPromoCode> getPromoCodes() {
        return promoCodeRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(mapper::toAdminPromoCode)
            .toList();
    }

    @Transactional
    public DomainModels.AdminPromoCode createPromoCode(ApiRequests.AdminPromoDraft draft) {
        PromoCodeEntity promo = new PromoCodeEntity();
        applyPromoDraft(promo, draft, true);
        return mapper.toAdminPromoCode(promoCodeRepository.save(promo));
    }

    @Transactional
    public DomainModels.AdminPromoCode updatePromoCode(Long promoId, ApiRequests.AdminPromoDraft draft) {
        PromoCodeEntity promo = promoCodeRepository.findById(promoId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Promo code not found."));
        applyPromoDraft(promo, draft, false);
        return mapper.toAdminPromoCode(promo);
    }

    private void applyPromoDraft(PromoCodeEntity promo, ApiRequests.AdminPromoDraft draft, boolean isNew) {
        String code = trimToEmpty(draft.code()).toUpperCase(Locale.ROOT);
        require(!code.isBlank(), "Promo code is required.");

        if ((isNew || !code.equalsIgnoreCase(promo.getCode()))
            && promoCodeRepository.existsByCodeIgnoreCase(code)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Promo code already exists.");
        }

        String discountType = trimToEmpty(draft.discountType()).toUpperCase(Locale.ROOT);
        require(
            "PERCENTAGE".equals(discountType) || "FIXED".equals(discountType),
            "Discount type must be PERCENTAGE or FIXED."
        );

        BigDecimal discountValue = parseRequiredMoney(draft.discountValue(), "discount value");
        require(discountValue.compareTo(BigDecimal.ZERO) > 0, "Discount value must be greater than 0.");
        require(
            !"PERCENTAGE".equals(discountType) || discountValue.compareTo(BigDecimal.valueOf(100)) <= 0,
            "Percentage discounts cannot exceed 100%."
        );

        BigDecimal minimumSubtotal = parseRequiredMoney(draft.minimumSubtotal(), "minimum subtotal");
        require(minimumSubtotal.compareTo(BigDecimal.ZERO) >= 0, "Minimum subtotal cannot be negative.");

        Integer usageLimit = parseOptionalInteger(draft.usageLimit(), "usage limit");
        require(usageLimit == null || usageLimit >= 0, "Usage limit cannot be negative.");

        LocalDateTime startsAt = parseOptionalDateTime(draft.startsAt(), "starts at");
        LocalDateTime endsAt = parseOptionalDateTime(draft.endsAt(), "ends at");
        require(startsAt == null || endsAt == null || !endsAt.isBefore(startsAt), "End date must be after start date.");

        LocalDateTime now = LocalDateTime.now();
        promo.setCode(code);
        promo.setDescription(trimToEmpty(draft.description()));
        promo.setDiscountType(discountType);
        promo.setDiscountValue(discountValue);
        promo.setMinimumSubtotal(minimumSubtotal);
        promo.setUsageLimit(usageLimit);
        promo.setActive(draft.active());
        promo.setStartsAt(startsAt);
        promo.setEndsAt(endsAt);
        promo.setUpdatedAt(now);

        if (isNew) {
            promo.setUsageCount(0);
            promo.setCreatedAt(now);
        }
    }

    private BigDecimal parseRequiredMoney(String value, String fieldName) {
        String normalized = trimToEmpty(value);
        require(!normalized.isBlank(), capitalize(fieldName) + " is required.");

        try {
            return new BigDecimal(normalized).setScale(2, RoundingMode.HALF_UP);
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + fieldName + ": " + value);
        }
    }

    private Integer parseOptionalInteger(String value, String fieldName) {
        String normalized = trimToEmpty(value);
        if (normalized.isBlank()) {
            return null;
        }

        try {
            return Integer.parseInt(normalized);
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + fieldName + ": " + value);
        }
    }

    private LocalDateTime parseOptionalDateTime(String value, String fieldName) {
        String normalized = trimToEmpty(value);
        if (normalized.isBlank()) {
            return null;
        }

        try {
            return LocalDateTime.parse(normalized, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + fieldName + ": " + value);
        }
    }

    private void require(boolean condition, String message) {
        if (!condition) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private String capitalize(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}
