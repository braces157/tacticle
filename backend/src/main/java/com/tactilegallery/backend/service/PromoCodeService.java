package com.tactilegallery.backend.service;

import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.persistence.entity.PromoCodeEntity;
import com.tactilegallery.backend.persistence.repository.PromoCodeRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PromoCodeService {

    private final PromoCodeRepository promoCodeRepository;

    public PromoCodeService(PromoCodeRepository promoCodeRepository) {
        this.promoCodeRepository = promoCodeRepository;
    }

    @Transactional(readOnly = true)
    public DomainModels.PromoQuote quote(String promoCode, BigDecimal subtotal) {
        AppliedPromo appliedPromo = resolvePromo(promoCode, subtotal, false);
        return toQuote(subtotal, appliedPromo);
    }

    @Transactional
    public DomainModels.PromoQuote redeem(String promoCode, BigDecimal subtotal) {
        AppliedPromo appliedPromo = resolvePromo(promoCode, subtotal, true);
        if (appliedPromo != null) {
            PromoCodeEntity entity = appliedPromo.entity();
            entity.setUsageCount(entity.getUsageCount() + 1);
            entity.setUpdatedAt(LocalDateTime.now());
        }
        return toQuote(subtotal, appliedPromo);
    }

    private DomainModels.PromoQuote toQuote(BigDecimal subtotal, AppliedPromo appliedPromo) {
        BigDecimal normalizedSubtotal = scaleMoney(subtotal);
        BigDecimal discount = appliedPromo == null ? BigDecimal.ZERO : appliedPromo.discountAmount();
        BigDecimal total = normalizedSubtotal.subtract(discount).max(BigDecimal.ZERO);
        return new DomainModels.PromoQuote(
            appliedPromo == null ? null : appliedPromo.entity().getCode(),
            appliedPromo == null ? null : appliedPromo.entity().getDescription(),
            normalizedSubtotal.doubleValue(),
            discount.doubleValue(),
            total.doubleValue()
        );
    }

    private AppliedPromo resolvePromo(String promoCode, BigDecimal subtotal, boolean forUpdate) {
        if (!StringUtils.hasText(promoCode)) {
            return null;
        }

        String normalizedCode = promoCode.trim().toUpperCase(Locale.ROOT);
        PromoCodeEntity entity = (forUpdate
            ? promoCodeRepository.findByCodeIgnoreCaseForUpdate(normalizedCode)
            : promoCodeRepository.findByCodeIgnoreCase(normalizedCode))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Promo code is invalid."));

        LocalDateTime now = LocalDateTime.now();
        if (!entity.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Promo code is not active.");
        }
        if (entity.getStartsAt() != null && now.isBefore(entity.getStartsAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Promo code is not active yet.");
        }
        if (entity.getEndsAt() != null && now.isAfter(entity.getEndsAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Promo code has expired.");
        }
        if (entity.getUsageLimit() != null && entity.getUsageCount() >= entity.getUsageLimit()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Promo code has already been fully redeemed.");
        }

        BigDecimal normalizedSubtotal = scaleMoney(subtotal);
        BigDecimal minimumSubtotal = scaleMoney(entity.getMinimumSubtotal());
        if (normalizedSubtotal.compareTo(minimumSubtotal) < 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Promo code requires a subtotal of $" + minimumSubtotal.setScale(2, RoundingMode.HALF_UP).toPlainString() + " or more."
            );
        }

        BigDecimal discountAmount = switch (entity.getDiscountType()) {
            case "PERCENTAGE" -> normalizedSubtotal
                .multiply(entity.getDiscountValue())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            case "FIXED" -> scaleMoney(entity.getDiscountValue());
            default -> throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Promo code configuration is invalid.");
        };

        discountAmount = discountAmount.min(normalizedSubtotal).max(BigDecimal.ZERO);
        if (discountAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Promo code does not change this order.");
        }

        return new AppliedPromo(entity, discountAmount);
    }

    private BigDecimal scaleMoney(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private record AppliedPromo(
        PromoCodeEntity entity,
        BigDecimal discountAmount
    ) {
    }
}
