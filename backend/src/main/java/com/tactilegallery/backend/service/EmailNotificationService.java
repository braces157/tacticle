package com.tactilegallery.backend.service;

import com.tactilegallery.backend.config.AppFrontendProperties;
import com.tactilegallery.backend.config.AppMailProperties;
import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.persistence.entity.AppUserEntity;
import java.text.NumberFormat;
import java.util.Locale;
import java.util.Map;
import java.util.StringJoiner;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class EmailNotificationService implements EmailNotificationSender {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);

    private final JavaMailSender mailSender;
    private final AppMailProperties mailProperties;
    private final AppFrontendProperties frontendProperties;
    private final EmailTemplateRenderer templateRenderer;

    public EmailNotificationService(
        JavaMailSender mailSender,
        AppMailProperties mailProperties,
        AppFrontendProperties frontendProperties,
        EmailTemplateRenderer templateRenderer
    ) {
        this.mailSender = mailSender;
        this.mailProperties = mailProperties;
        this.frontendProperties = frontendProperties;
        this.templateRenderer = templateRenderer;
    }

    @Override
    public void sendRegistrationConfirmation(AppUserEntity user) {
        if (!canSendTo(user == null ? null : user.getEmail())) {
            return;
        }

        send(
            user.getEmail(),
            "Welcome to Tactile Gallery",
            registrationPlainText(user),
            templateRenderer.renderRegistrationHtml(user)
        );
    }

    @Override
    public void sendOrderConfirmation(DomainModels.OrderDetail order) {
        if (!canSendTo(order == null ? null : order.customerEmail())) {
            return;
        }

        send(
            order.customerEmail(),
            "Order confirmation " + order.id(),
            orderPlainText(order),
            templateRenderer.renderOrderHtml(order)
        );
    }

    private boolean canSendTo(String recipient) {
        return mailProperties.isEnabled()
            && StringUtils.hasText(mailProperties.getFrom())
            && StringUtils.hasText(recipient);
    }

    private void send(String recipient, String subject, String plainBody, String htmlBody) {
        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(recipient);
            helper.setSubject(subject);
            helper.setText(plainBody, htmlBody);

            if (StringUtils.hasText(mailProperties.getFrom())) {
                helper.setFrom(mailProperties.getFrom(), mailProperties.getFromName());
            }

            mailSender.send(message);
        } catch (MailException | jakarta.mail.MessagingException | java.io.UnsupportedEncodingException exception) {
            log.warn("Failed to send notification email to {}", recipient, exception);
        }
    }

    private String registrationPlainText(AppUserEntity user) {
        return """
            Hi %s,

            Your Tactile Gallery account is ready.

            You can now sign in with:
            - Email: %s

            Explore the gallery:
            %s

            Thank you for registering with Tactile Gallery.

            Tactile Gallery
            """.formatted(user.getName(), user.getEmail(), frontendUrl("/browse"));
    }

    private String orderPlainText(DomainModels.OrderDetail order) {
        NumberFormat currency = NumberFormat.getCurrencyInstance(Locale.US);
        StringJoiner plainItems = new StringJoiner(System.lineSeparator());
        for (DomainModels.CartItem item : order.items()) {
            plainItems.add("- %s x%d (%s)%s".formatted(
                item.productName(),
                item.quantity(),
                currency.format(item.price()),
                formatSelectedOptionsPlain(item.selectedOptions())
            ));
        }

        return """
            Hi %s,

            Thank you for your order with Tactile Gallery.

            Order number: %s
            Status: %s
            Total: %s

            Items:
            %s

            Shipping address:
            %s
            %s, %s
            %s

            We will email you again when the order status changes.

            Tactile Gallery
            """.formatted(
            order.customerName(),
            order.id(),
            order.status(),
            currency.format(order.total()),
            plainItems,
            order.shippingAddress().line1(),
            order.shippingAddress().city(),
            order.shippingAddress().postalCode(),
            order.shippingAddress().country()
        );
    }

    private String frontendUrl(String path) {
        String baseUrl = frontendProperties.getBaseUrl();
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        return path.startsWith("/") ? baseUrl + path : baseUrl + "/" + path;
    }

    private String formatSelectedOptionsPlain(Map<String, String> selectedOptions) {
        if (selectedOptions == null || selectedOptions.isEmpty()) {
            return "";
        }

        StringJoiner joiner = new StringJoiner(", ", " | ", "");
        selectedOptions.entrySet().stream()
            .sorted(Map.Entry.comparingByKey(String.CASE_INSENSITIVE_ORDER))
            .forEach(entry -> joiner.add(entry.getKey() + ": " + entry.getValue()));
        return joiner.toString();
    }
}
