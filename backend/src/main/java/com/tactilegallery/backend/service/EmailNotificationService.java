package com.tactilegallery.backend.service;

import com.tactilegallery.backend.config.AppFrontendProperties;
import com.tactilegallery.backend.config.AppMailProperties;
import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.persistence.entity.AppUserEntity;
import java.text.NumberFormat;
import java.util.Map;
import java.util.Locale;
import java.util.StringJoiner;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;
import org.springframework.util.StringUtils;

@Service
public class EmailNotificationService implements EmailNotificationSender {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);

    private final JavaMailSender mailSender;
    private final AppMailProperties mailProperties;
    private final AppFrontendProperties frontendProperties;

    public EmailNotificationService(
        JavaMailSender mailSender,
        AppMailProperties mailProperties,
        AppFrontendProperties frontendProperties
    ) {
        this.mailSender = mailSender;
        this.mailProperties = mailProperties;
        this.frontendProperties = frontendProperties;
    }

    @Override
    public void sendRegistrationConfirmation(AppUserEntity user) {
        if (!isEnabled() || user == null || !StringUtils.hasText(user.getEmail())) {
            return;
        }

        String subject = "Welcome to Tactile Gallery";
        String plainBody = """
            Hi %s,

            Your Tactile Gallery account is ready.

            You can now sign in with:
            - Email: %s

            Explore the gallery:
            %s

            Thank you for registering with Tactile Gallery.

            Tactile Gallery
            """.formatted(user.getName(), user.getEmail(), frontendUrl("/browse"));
        String htmlBody = registrationHtml(user);

        send(user.getEmail(), subject, plainBody, htmlBody);
    }

    @Override
    public void sendOrderConfirmation(DomainModels.OrderDetail order) {
        if (!isEnabled() || order == null || !StringUtils.hasText(order.customerEmail())) {
            return;
        }

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

        String subject = "Order confirmation " + order.id();
        String plainBody = """
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

            View your order:
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
            order.shippingAddress().country(),
            frontendUrl("/orders/" + order.id())
        );
        String htmlBody = orderHtml(order, currency);

        send(order.customerEmail(), subject, plainBody, htmlBody);
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

    private boolean isEnabled() {
        return mailProperties.isEnabled() && StringUtils.hasText(mailProperties.getFrom());
    }

    private String registrationHtml(AppUserEntity user) {
        String browseUrl = frontendUrl("/browse");
        String content = """
            <p style="margin:0 0 16px; font-size:16px; line-height:28px; color:#5a6061;">
              Your account is ready. You can now sign in with <strong style="color:#2d3435;">%s</strong>
              and start exploring the current collection.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="margin:24px 0; border-collapse:separate;">
              <tr>
                <td style="border:1px solid rgba(173,179,180,0.18); background:#f2f4f4; border-radius:20px; padding:20px 22px;">
                  <div style="font-size:11px; letter-spacing:0.22em; text-transform:uppercase; font-weight:700; color:#5f5e5e; margin-bottom:10px;">
                    Account details
                  </div>
                  <div style="font-size:15px; line-height:26px; color:#2d3435;">
                    <strong>Name:</strong> %s<br/>
                    <strong>Email:</strong> %s
                  </div>
                </td>
              </tr>
            </table>
            %s
            <p style="margin:24px 0 0; font-size:14px; line-height:24px; color:#5a6061;">
              Designed for calm desks, collected with intent.
            </p>
            """.formatted(
            escapeHtml(user.getEmail()),
            escapeHtml(user.getName()),
            escapeHtml(user.getEmail()),
            actionButton("Browse the gallery", browseUrl)
        );

        return wrapEmail(
            "Registration confirmed",
            safeDisplayName(user.getName()) + ", welcome to Tactile Gallery.",
            content
        );
    }

    private String orderHtml(DomainModels.OrderDetail order, NumberFormat currency) {
        StringBuilder itemsHtml = new StringBuilder();
        for (DomainModels.CartItem item : order.items()) {
            itemsHtml.append("""
                <tr>
                  <td style="padding:18px 0; border-bottom:1px solid rgba(173,179,180,0.18); vertical-align:top;">
                    <div style="font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:18px; font-weight:800; letter-spacing:-0.03em; color:#2d3435;">
                      %s
                    </div>
                    <div style="margin-top:6px; font-size:14px; line-height:24px; color:#5a6061;">
                      Qty %d%s
                    </div>
                  </td>
                  <td style="padding:18px 0; border-bottom:1px solid rgba(173,179,180,0.18); vertical-align:top; text-align:right;">
                    <div style="font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:18px; font-weight:800; letter-spacing:-0.03em; color:#2d3435;">
                      %s
                    </div>
                    <div style="margin-top:6px; font-size:13px; line-height:22px; color:#5a6061;">
                      %s each
                    </div>
                  </td>
                </tr>
                """.formatted(
                escapeHtml(item.productName()),
                item.quantity(),
                formatSelectedOptionsHtml(item.selectedOptions()),
                currency.format(item.price() * item.quantity()),
                currency.format(item.price())
            ));
        }

        String summaryCards = """
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="margin:24px 0 0; border-collapse:separate;">
              <tr>
                <td width="33.33%%" style="padding-right:8px;">
                  %s
                </td>
                <td width="33.33%%" style="padding-left:4px; padding-right:4px;">
                  %s
                </td>
                <td width="33.33%%" style="padding-left:8px;">
                  %s
                </td>
              </tr>
            </table>
            """.formatted(
            summaryCard("Order number", order.id()),
            summaryCard("Status", order.status()),
            summaryCard("Total", currency.format(order.total()))
        );

        String content = """
            <p style="margin:0 0 16px; font-size:16px; line-height:28px; color:#5a6061;">
              Your order has been placed and the workshop queue is now preparing it for the next step.
            </p>
            %s
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="margin:28px 0 0; border-collapse:collapse;">
              %s
            </table>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="margin:28px 0 0; border-collapse:separate;">
              <tr>
                <td style="border:1px solid rgba(173,179,180,0.18); background:#f2f4f4; border-radius:20px; padding:20px 22px;">
                  <div style="font-size:11px; letter-spacing:0.22em; text-transform:uppercase; font-weight:700; color:#5f5e5e; margin-bottom:10px;">
                    Shipping address
                  </div>
                  <div style="font-size:15px; line-height:26px; color:#2d3435;">
                    %s<br/>
                    %s, %s<br/>
                    %s
                  </div>
                </td>
              </tr>
            </table>
            %s
            <p style="margin:24px 0 0; font-size:14px; line-height:24px; color:#5a6061;">
              Payment status: <strong style="color:#2d3435;">%s</strong><br/>
              Fulfillment: <strong style="color:#2d3435;">%s</strong>
            </p>
            """.formatted(
            summaryCards,
            itemsHtml,
            escapeHtml(order.shippingAddress().line1()),
            escapeHtml(order.shippingAddress().city()),
            escapeHtml(order.shippingAddress().postalCode()),
            escapeHtml(order.shippingAddress().country()),
            actionButton("View order details", frontendUrl("/orders/" + order.id())),
            escapeHtml(order.paymentStatus()),
            escapeHtml(order.fulfillment())
        );

        return wrapEmail(
            "Order confirmed",
            safeDisplayName(order.customerName()) + ", your gallery order is in motion.",
            content
        );
    }

    private String wrapEmail(String eyebrow, String title, String content) {
        return """
            <!doctype html>
            <html lang="en">
              <body style="margin:0; padding:0; background:#f9f9f9; color:#2d3435; font-family:Inter, 'Segoe UI', Arial, sans-serif;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="background:#f9f9f9; margin:0; padding:32px 12px;">
                  <tr>
                    <td align="center">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="max-width:680px; border-collapse:separate;">
                        <tr>
                          <td style="padding:0 0 18px 4px; font-size:12px; color:#5a6061;">
                            Tactile Gallery
                          </td>
                        </tr>
                        <tr>
                          <td style="background:linear-gradient(145deg, #5f5e5e, #535252); border-radius:28px 28px 0 0; padding:28px 32px 22px; color:#faf7f6;">
                            <div style="font-size:11px; letter-spacing:0.22em; text-transform:uppercase; font-weight:700; opacity:0.86;">
                              %s
                            </div>
                            <div style="margin-top:14px; font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:34px; line-height:1.02; letter-spacing:-0.04em; font-weight:800;">
                              %s
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="background:#ffffff; border-radius:0 0 28px 28px; padding:32px; box-shadow:0 0 32px rgba(45,52,53,0.05);">
                            %s
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:18px 8px 0; text-align:center; font-size:12px; line-height:22px; color:#5a6061;">
                            Quiet precision for the daily ritual.<br/>
                            %s
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
            """.formatted(
            escapeHtml(eyebrow),
            escapeHtml(title),
            content,
            escapeHtml(trimTrailingSlash(frontendProperties.getBaseUrl()))
        );
    }

    private String actionButton(String label, String href) {
        return """
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;">
              <tr>
                <td align="center" bgcolor="#5f5e5e" style="border-radius:6px;">
                  <a href="%s"
                     style="display:inline-block; padding:14px 22px; font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:15px; font-weight:700; letter-spacing:-0.01em; color:#faf7f6; text-decoration:none;">
                    %s
                  </a>
                </td>
              </tr>
            </table>
            """.formatted(attributeEscape(href), escapeHtml(label));
    }

    private String summaryCard(String label, String value) {
        return """
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="border:1px solid rgba(173,179,180,0.18); background:#f2f4f4; border-radius:18px;">
              <tr>
                <td style="padding:16px 18px;">
                  <div style="font-size:11px; letter-spacing:0.22em; text-transform:uppercase; font-weight:700; color:#5f5e5e; margin-bottom:8px;">
                    %s
                  </div>
                  <div style="font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:20px; line-height:1.1; letter-spacing:-0.03em; font-weight:800; color:#2d3435;">
                    %s
                  </div>
                </td>
              </tr>
            </table>
            """.formatted(escapeHtml(label), escapeHtml(value));
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

    private String formatSelectedOptionsHtml(Map<String, String> selectedOptions) {
        if (selectedOptions == null || selectedOptions.isEmpty()) {
            return "";
        }

        StringJoiner joiner = new StringJoiner(" &middot; ");
        selectedOptions.entrySet().stream()
            .sorted(Map.Entry.comparingByKey(String.CASE_INSENSITIVE_ORDER))
            .forEach(entry -> joiner.add(
                "<span style=\"white-space:nowrap;\">" + escapeHtml(entry.getKey()) + ": "
                    + escapeHtml(entry.getValue()) + "</span>"
            ));
        return "<br/><span style=\"font-size:13px; line-height:22px; color:#5a6061;\">" + joiner + "</span>";
    }

    private String frontendUrl(String path) {
        String baseUrl = trimTrailingSlash(frontendProperties.getBaseUrl());
        if (!StringUtils.hasText(path)) {
            return baseUrl;
        }
        return path.startsWith("/") ? baseUrl + path : baseUrl + "/" + path;
    }

    private String trimTrailingSlash(String value) {
        if (!StringUtils.hasText(value)) {
            return "http://localhost:5173";
        }

        String normalized = value.trim();
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private String safeDisplayName(String value) {
        return StringUtils.hasText(value) ? value.trim() : "Collector";
    }

    private String escapeHtml(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value);
    }

    private String attributeEscape(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value, "UTF-8");
    }
}
