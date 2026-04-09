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
        String membership = user.getProfile() != null && StringUtils.hasText(user.getProfile().getMembership())
            ? user.getProfile().getMembership()
            : "Gallery Member";
        String content = """
            <p style="margin:0 0 14px; font-size:15px; line-height:26px; color:#5a6061;">
              Your account has been successfully created. Sign in with
              <strong style="color:#2d3435;">%s</strong> and begin exploring our curated collection of artisanal switches,
              premium keycaps, and considered desk objects.
            </p>
            %s
            %s
            <p style="margin:18px 0 0; font-size:13px; line-height:22px; color:#5a6061; font-style:italic;">
              Membership includes early access to limited-edition group buys and new gallery drops.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="margin:18px 0 0; border-collapse:separate;">
              <tr>
                <td width="50%%" style="padding-right:8px; vertical-align:top;">
                  %s
                </td>
                <td width="50%%" style="padding-left:8px; vertical-align:top;">
                  %s
                </td>
              </tr>
            </table>
            """.formatted(
            escapeHtml(user.getEmail()),
            sectionBox(
                "Account details",
                """
                <div style="font-size:14px; line-height:24px; color:#2d3435;">
                  <strong>Member Name:</strong> %s<br/>
                  <strong>Account Email:</strong> %s
                </div>
                """.formatted(
                    escapeHtml(user.getName()),
                    escapeHtml(user.getEmail())
                )
            ),
            actionButton("Browse the gallery", browseUrl),
            metaBox("Status", "Active"),
            metaBox("Membership", escapeHtml(membership))
        );

        return wrapEmail(
            "Registration confirmed",
            "Welcome to the Gallery",
            content
        );
    }

    private String orderHtml(DomainModels.OrderDetail order, NumberFormat currency) {
        double subtotalAmount = order.items().stream()
            .mapToDouble(item -> item.price() * item.quantity())
            .sum();

        StringBuilder itemsHtml = new StringBuilder();
        for (DomainModels.CartItem item : order.items()) {
            itemsHtml.append("""
                <tr>
                  <td style="padding:18px 0; border-bottom:1px solid rgba(173,179,180,0.18);">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="border-collapse:collapse;">
                      <tr>
                        <td width="76" style="vertical-align:top; padding-right:16px;">
                          %s
                        </td>
                        <td style="vertical-align:top;">
                          <div style="font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:18px; font-weight:800; letter-spacing:-0.03em; color:#2d3435;">
                            %s
                          </div>
                          <div style="margin-top:6px; font-size:14px; line-height:24px; color:#5a6061;">
                            Qty %d%s
                          </div>
                        </td>
                        <td style="vertical-align:top; text-align:right; white-space:nowrap; padding-left:16px;">
                          <div style="font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:18px; font-weight:800; letter-spacing:-0.03em; color:#2d3435;">
                            %s
                          </div>
                          <div style="margin-top:6px; font-size:13px; line-height:22px; color:#5a6061;">
                            %s each
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                """.formatted(
                imageThumb(item),
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
                <td width="33.33%%" style="padding-right:8px; vertical-align:top;">
                  %s
                </td>
                <td width="33.33%%" style="padding-left:4px; padding-right:4px; vertical-align:top;">
                  %s
                </td>
                <td width="33.33%%" style="padding-left:8px; vertical-align:top;">
                  %s
                </td>
              </tr>
            </table>
            """.formatted(
            summaryCard("Order number", order.id()),
            summaryCard("Status", order.status()),
            summaryCard("Total", currency.format(order.total()))
        );

        String summaryTotals = """
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="margin:24px 0 0; border-collapse:separate;">
              <tr>
                <td style="border:1px solid rgba(173,179,180,0.18); background:#ffffff; border-radius:20px; padding:20px 22px;">
                  <div style="font-size:11px; letter-spacing:0.22em; text-transform:uppercase; font-weight:700; color:#5f5e5e; margin-bottom:14px;">
                    Order summary
                  </div>
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="border-collapse:collapse;">
                    <tr>
                      <td style="padding:0 0 10px; font-size:14px; line-height:22px; color:#5a6061;">Subtotal</td>
                      <td style="padding:0 0 10px; font-size:14px; line-height:22px; color:#2d3435; text-align:right;">%s</td>
                    </tr>
                    <tr>
                      <td style="padding:0 0 10px; font-size:14px; line-height:22px; color:#5a6061;">Shipping</td>
                      <td style="padding:0 0 10px; font-size:14px; line-height:22px; color:#2d3435; text-align:right;">Complimentary</td>
                    </tr>
                    <tr>
                      <td style="padding:12px 0 0; border-top:1px solid rgba(173,179,180,0.18); font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:18px; line-height:24px; font-weight:800; letter-spacing:-0.03em; color:#2d3435;">Total</td>
                      <td style="padding:12px 0 0; border-top:1px solid rgba(173,179,180,0.18); font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:18px; line-height:24px; font-weight:800; letter-spacing:-0.03em; color:#2d3435; text-align:right;">%s</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            """.formatted(
            currency.format(subtotalAmount),
            currency.format(order.total())
        );

        String detailBlocks = """
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="margin:24px 0 0; border-collapse:separate;">
              <tr>
                <td width="50%%" style="padding-right:8px; vertical-align:top;">
                  %s
                </td>
                <td width="50%%" style="padding-left:8px; vertical-align:top;">
                  %s
                </td>
              </tr>
            </table>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="margin:16px 0 0; border-collapse:separate;">
              <tr>
                <td>
                  %s
                </td>
              </tr>
            </table>
            """.formatted(
            detailCard(
                "Shipping address",
                """
                %s<br/>
                %s<br/>
                %s, %s<br/>
                %s
                """.formatted(
                    escapeHtml(order.customerName()),
                    escapeHtml(order.shippingAddress().line1()),
                    escapeHtml(order.shippingAddress().city()),
                    escapeHtml(order.shippingAddress().postalCode()),
                    escapeHtml(order.shippingAddress().country())
                )
            ),
            detailCard("Payment", escapeHtml(order.paymentStatus())),
            detailCard("Fulfillment", escapeHtml(order.fulfillment()))
        );

        String content = """
            <p style="margin:0 0 14px; font-size:15px; line-height:26px; color:#5a6061;">
              Your order has been confirmed and the workshop is preparing the next step with the same technical precision
              carried through the rest of the gallery.
            </p>
            %s
            %s
            %s
            %s
            %s
            """.formatted(
            summaryCards,
            sectionBox(
                "Selected artifacts",
                """
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="border-collapse:collapse;">
                  %s
                </table>
                """.formatted(itemsHtml)
            ),
            summaryTotals,
            detailBlocks,
            actionButton("View order details", frontendUrl("/orders/" + order.id()))
        );

        return wrapEmail(
            "Order confirmed",
            "Your journey begins.",
            content
        );
    }

    private String wrapEmail(String eyebrow, String title, String content) {
        return """
            <!doctype html>
            <html lang="en">
              <body style="margin:0; padding:0; background:#f2f4f4; color:#2d3435; font-family:Inter, 'Segoe UI', Arial, sans-serif;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="background:#f2f4f4; margin:0; padding:24px 10px;">
                  <tr>
                    <td align="center">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="max-width:640px; border-collapse:separate;">
                        <tr>
                          <td style="padding:0 0 10px 4px; font-size:12px; color:#5a6061; font-weight:600;">
                            Tactile
                          </td>
                        </tr>
                        <tr>
                          <td style="background:#5f5e5e; border-radius:18px 18px 0 0; padding:18px 24px 16px; color:#faf7f6; border:1px solid #535252;">
                            <div style="font-size:10px; letter-spacing:0.22em; text-transform:uppercase; font-weight:700; opacity:0.88;">
                              %s
                            </div>
                            <div style="margin-top:10px; font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:28px; line-height:1.06; letter-spacing:-0.04em; font-weight:800;">
                              %s
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="background:#ffffff; border:1px solid #d4dbdd; border-top:none; border-radius:0 0 18px 18px; padding:22px 24px 24px;">
                            %s
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:12px 8px 0; text-align:center; font-size:11px; line-height:20px; color:#5a6061;">
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
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:18px;">
              <tr>
                <td align="center" bgcolor="#5f5e5e" style="border-radius:6px;">
                  <a href="%s"
                     style="display:inline-block; padding:12px 18px; font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:14px; font-weight:700; letter-spacing:-0.01em; color:#faf7f6; text-decoration:none;">
                    %s
                  </a>
                </td>
              </tr>
            </table>
            """.formatted(attributeEscape(href), escapeHtml(label));
    }

    private String summaryCard(String label, String value) {
        return """
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="border:1px solid #d4dbdd; background:#f2f4f4; border-radius:14px;">
              <tr>
                <td style="padding:14px 16px;">
                  <div style="font-size:10px; letter-spacing:0.22em; text-transform:uppercase; font-weight:700; color:#5f5e5e; margin-bottom:8px;">
                    %s
                  </div>
                  <div style="font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:18px; line-height:1.1; letter-spacing:-0.03em; font-weight:800; color:#2d3435;">
                    %s
                  </div>
                </td>
              </tr>
            </table>
            """.formatted(escapeHtml(label), escapeHtml(value));
    }

    private String detailCard(String label, String valueHtml) {
        return """
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="border:1px solid #d4dbdd; background:#f2f4f4; border-radius:14px;">
              <tr>
                <td style="padding:16px 18px;">
                  <div style="font-size:10px; letter-spacing:0.22em; text-transform:uppercase; font-weight:700; color:#5f5e5e; margin-bottom:8px;">
                    %s
                  </div>
                  <div style="font-size:14px; line-height:24px; color:#2d3435;">
                    %s
                  </div>
                </td>
              </tr>
            </table>
            """.formatted(escapeHtml(label), valueHtml);
    }

    private String sectionBox(String label, String valueHtml) {
        return """
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="margin:18px 0 0; border:1px solid #d4dbdd; background:#f2f4f4; border-radius:14px;">
              <tr>
                <td style="padding:16px 18px;">
                  <div style="font-size:10px; letter-spacing:0.22em; text-transform:uppercase; font-weight:700; color:#5f5e5e; margin-bottom:10px;">
                    %s
                  </div>
                  %s
                </td>
              </tr>
            </table>
            """.formatted(escapeHtml(label), valueHtml);
    }

    private String metaBox(String label, String value) {
        return """
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="border:1px solid #d4dbdd; background:#ffffff; border-radius:12px;">
              <tr>
                <td style="padding:12px 14px;">
                  <div style="font-size:10px; letter-spacing:0.22em; text-transform:uppercase; font-weight:700; color:#5f5e5e; margin-bottom:6px;">
                    %s
                  </div>
                  <div style="font-size:13px; line-height:20px; color:#2d3435; font-weight:600;">
                    %s
                  </div>
                </td>
              </tr>
            </table>
            """.formatted(escapeHtml(label), value);
    }

    private String imageThumb(DomainModels.CartItem item) {
        if (item.image() == null || !StringUtils.hasText(item.image().src())) {
            return """
                <div style="width:60px; height:60px; border-radius:14px; background:#f2f4f4;"></div>
                """;
        }

        return """
            <img src="%s" alt="%s" width="60" height="60"
                 style="display:block; width:60px; height:60px; border-radius:14px; object-fit:cover; background:#f2f4f4;"/>
            """.formatted(
            attributeEscape(item.image().src()),
            attributeEscape(StringUtils.hasText(item.image().alt()) ? item.image().alt() : item.productName())
        );
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

    private String escapeHtml(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value);
    }

    private String attributeEscape(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value, "UTF-8");
    }
}
