package com.tactilegallery.backend.service;

import com.tactilegallery.backend.config.AppFrontendProperties;
import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.persistence.entity.AppUserEntity;
import java.text.NumberFormat;
import java.util.Locale;
import java.util.Map;
import java.util.StringJoiner;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.util.HtmlUtils;

@Component
public class EmailTemplateRenderer {

    private final AppFrontendProperties frontendProperties;

    public EmailTemplateRenderer(AppFrontendProperties frontendProperties) {
        this.frontendProperties = frontendProperties;
    }

    public String renderRegistrationHtml(AppUserEntity user) {
        String browseUrl = frontendUrl("/browse");
        String membership = user.getProfile() != null && StringUtils.hasText(user.getProfile().getMembership())
            ? user.getProfile().getMembership()
            : "Artisan Founder";

        return """
            <!doctype html>
            <html lang="en">
              <body style="margin:0; padding:0; background:#f2f4f4; color:#2d3435; font-family:Inter, 'Segoe UI', Arial, sans-serif;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="background:#f2f4f4; margin:0; padding:48px 16px;">
                  <tr>
                    <td align="center">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="width:100%%; max-width:640px; background:#ffffff; border-collapse:collapse;">
                        <tr>
                          <td align="center" style="padding:28px 24px; background:#f9f9f9;">
                            <div style="font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:24px; line-height:28px; font-weight:800; letter-spacing:0.18em; text-transform:uppercase; color:#2d3435;">
                              Tactile
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:48px 40px; background:#5f5e5e; color:#faf7f7;">
                            <div style="font-size:10px; line-height:14px; letter-spacing:0.2em; text-transform:uppercase; font-weight:700; opacity:0.84; margin-bottom:8px;">
                              Registration Confirmed
                            </div>
                            <div style="font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:34px; line-height:38px; font-weight:800; letter-spacing:-0.03em;">
                              Welcome to the Gallery
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:48px 40px 40px; background:#ffffff;">
                            <p style="margin:0 0 36px; max-width:420px; font-size:15px; line-height:26px; color:#5a6061;">
                              Your credentials have been verified. You now have full access to our curated editorial archives and industrial design collections.
                            </p>
                            <div style="margin:0 0 36px;">
                              <div style="font-size:11px; line-height:16px; letter-spacing:0.18em; text-transform:uppercase; font-weight:700; color:#2d3435; margin-bottom:14px;">
                                Account Details
                              </div>
                              <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="background:#ebeeef; border-left:4px solid #5f5e5e; border-collapse:collapse;">
                                <tr>
                                  <td style="padding:20px 20px 8px;">
                                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="border-collapse:collapse;">
                                      <tr>
                                        <td style="padding:0 0 12px; font-size:10px; line-height:14px; letter-spacing:0.16em; text-transform:uppercase; font-weight:700; color:#5a6061;">Member Name</td>
                                        <td align="right" style="padding:0 0 12px; font-size:14px; line-height:20px; font-weight:700; color:#2d3435;">%s</td>
                                      </tr>
                                      <tr>
                                        <td style="padding:0; font-size:10px; line-height:14px; letter-spacing:0.16em; text-transform:uppercase; font-weight:700; color:#5a6061;">Account Email</td>
                                        <td align="right" style="padding:0; font-size:14px; line-height:20px; font-weight:700; color:#2d3435;">%s</td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </div>
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="margin:0 0 36px; border-collapse:collapse;">
                              <tr>
                                <td align="center" bgcolor="#5f5e5e" style="border-radius:2px;">
                                  <a href="%s" style="display:block; padding:18px 20px; font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:15px; line-height:20px; font-weight:800; letter-spacing:-0.01em; color:#faf7f7; text-decoration:none;">
                                    Browse the Gallery
                                  </a>
                                </td>
                              </tr>
                            </table>
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="border:1px solid rgba(173,179,180,0.15); background:#f2f4f4; border-collapse:collapse;">
                              <tr>
                                <td style="padding:20px;">
                                  <p style="margin:0; font-size:12px; line-height:22px; color:#5a6061; font-style:italic;">
                                    As an early registrant, your account has been flagged for prioritized early access to our upcoming limited edition hardware releases. Watch your inbox for private collection keys.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="background:#e4e9ea; border-top:1px solid rgba(173,179,180,0.15);">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="border-collapse:collapse;">
                              <tr>
                                <td width="50%%" style="padding:28px 32px; border-right:1px solid rgba(173,179,180,0.15); vertical-align:top;">
                                  <div style="font-size:10px; line-height:14px; letter-spacing:0.12em; text-transform:uppercase; font-weight:700; color:#5a6061; margin-bottom:8px;">Status</div>
                                  <div style="font-size:14px; line-height:20px; font-weight:800; color:#2d3435;">Active / Verified</div>
                                </td>
                                <td width="50%%" style="padding:28px 32px; vertical-align:top;">
                                  <div style="font-size:10px; line-height:14px; letter-spacing:0.12em; text-transform:uppercase; font-weight:700; color:#5a6061; margin-bottom:8px;">Tier</div>
                                  <div style="font-size:14px; line-height:20px; font-weight:800; color:#2d3435;">%s</div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding:44px 32px; background:#f2f4f4;">
                            <div style="font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:20px; line-height:24px; font-weight:800; letter-spacing:-0.02em; color:#2d3435; margin-bottom:18px;">
                              Precision Editorial.
                            </div>
                            <div style="font-size:10px; line-height:18px; letter-spacing:0.14em; text-transform:uppercase; color:#5a6061; margin-bottom:14px;">
                              Support&nbsp;&nbsp;&nbsp;Privacy Policy&nbsp;&nbsp;&nbsp;Terms of Service&nbsp;&nbsp;&nbsp;Unsubscribe
                            </div>
                            <div style="font-size:10px; line-height:18px; letter-spacing:0.14em; text-transform:uppercase; color:#5a6061; opacity:0.7;">
                              © 2026 Tactile. All rights reserved.
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
            """.formatted(
            escapeHtml(user.getName()),
            escapeHtml(user.getEmail()),
            attributeEscape(browseUrl),
            escapeHtml(membership)
        );
    }

    public String renderOrderHtml(DomainModels.OrderDetail order) {
        NumberFormat currency = NumberFormat.getCurrencyInstance(Locale.US);
        return """
            <!doctype html>
            <html lang="en">
              <body style="margin:0; padding:0; background:#f2f4f4; color:#2d3435; font-family:Inter, 'Segoe UI', Arial, sans-serif;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="background:#f2f4f4; margin:0; padding:48px 16px;">
                  <tr>
                    <td align="center">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="width:100%%; max-width:640px; background:#f9f9f9; border-collapse:collapse;">
                        %s
                        %s
                        %s
                        %s
                        %s
                        %s
                        %s
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
            """.formatted(
            headerSection(),
            heroSection(),
            metaSection(order, currency),
            itemsSection(order, currency),
            detailsSection(order),
            totalsSection(order, currency),
            footerSection()
        );
    }

    private String headerSection() {
        return """
            <tr>
              <td style="padding:26px 40px; background:#f9f9f9;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="border-collapse:collapse;">
                  <tr>
                    <td style="font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:22px; line-height:28px; font-weight:800; letter-spacing:-0.03em; color:#2d3435;">
                      Tactile
                    </td>
                    <td align="right" style="font-size:12px; line-height:18px; font-weight:700; color:#5a6061;">
                      Orders&nbsp;&nbsp;&nbsp;Support&nbsp;&nbsp;&nbsp;Catalog
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            """;
    }

    private String heroSection() {
        return """
            <tr>
              <td style="padding:42px 40px 26px; background:#f9f9f9;">
                <div style="font-size:10px; line-height:14px; letter-spacing:0.2em; text-transform:uppercase; font-weight:700; color:#5f5e5e; margin-bottom:8px;">
                  Order Confirmed
                </div>
                <div style="font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:36px; line-height:38px; font-weight:800; letter-spacing:-0.04em; color:#2d3435;">
                  Your journey begins.
                </div>
                <p style="margin:14px 0 0; max-width:320px; font-size:14px; line-height:24px; color:#5a6061;">
                  We&apos;ve received your commission. Our craftsmen are now preparing your artifacts for dispatch.
                </p>
              </td>
            </tr>
            """;
    }

    private String metaSection(DomainModels.OrderDetail order, NumberFormat currency) {
        return """
            <tr>
              <td style="padding:0 40px 30px; background:#f9f9f9;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="background:#f2f4f4; border:1px solid rgba(173,179,180,0.12); border-collapse:collapse;">
                  <tr>
                    <td width="33.33%%" style="padding:20px; border-right:1px solid rgba(173,179,180,0.12); vertical-align:top;">
                      <div style="font-size:10px; line-height:14px; letter-spacing:0.16em; text-transform:uppercase; font-weight:700; color:#5a6061; margin-bottom:8px;">Order Number</div>
                      <div style="font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:16px; line-height:20px; font-weight:800; color:#2d3435;">#%s</div>
                    </td>
                    <td width="33.33%%" style="padding:20px; border-right:1px solid rgba(173,179,180,0.12); vertical-align:top;">
                      <div style="font-size:10px; line-height:14px; letter-spacing:0.16em; text-transform:uppercase; font-weight:700; color:#5a6061; margin-bottom:8px;">Status</div>
                      <div style="font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:16px; line-height:20px; font-weight:800; color:#2d3435;">%s</div>
                    </td>
                    <td width="33.33%%" style="padding:20px; vertical-align:top;">
                      <div style="font-size:10px; line-height:14px; letter-spacing:0.16em; text-transform:uppercase; font-weight:700; color:#5a6061; margin-bottom:8px;">Total</div>
                      <div style="font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:16px; line-height:20px; font-weight:800; color:#2d3435;">%s</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            """.formatted(
            escapeHtml(order.id()),
            escapeHtml(order.status()),
            escapeHtml(currency.format(order.total()))
        );
    }

    private String itemsSection(DomainModels.OrderDetail order, NumberFormat currency) {
        StringBuilder rows = new StringBuilder();
        for (DomainModels.CartItem item : order.items()) {
            rows.append("""
                <tr>
                  <td style="padding:0 0 26px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="border-collapse:collapse;">
                      <tr>
                        <td width="76" style="vertical-align:top; padding-right:18px;">
                          %s
                        </td>
                        <td style="vertical-align:top;">
                          <div style="font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:16px; line-height:20px; font-weight:800; letter-spacing:-0.03em; color:#2d3435;">
                            %s
                          </div>
                          <div style="margin-top:6px; font-size:11px; line-height:18px; color:#5a6061; text-transform:uppercase; letter-spacing:0.08em;">
                            Qty %d%s
                          </div>
                        </td>
                        <td style="vertical-align:top; text-align:right; white-space:nowrap; padding-left:16px;">
                          <div style="font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:16px; line-height:20px; font-weight:800; letter-spacing:-0.03em; color:#2d3435;">
                            %s
                          </div>
                          <div style="margin-top:6px; font-size:12px; line-height:18px; color:#5a6061;">
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

        return """
            <tr>
              <td style="padding:30px 40px 32px; background:#ffffff;">
                <div style="font-size:11px; line-height:16px; letter-spacing:0.15em; text-transform:uppercase; font-weight:700; color:#5a6061; margin-bottom:28px;">
                  Selected Artifacts
                </div>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="border-collapse:collapse;">
                  %s
                </table>
              </td>
            </tr>
            """.formatted(rows);
    }

    private String detailsSection(DomainModels.OrderDetail order) {
        return """
            <tr>
              <td style="padding:34px 40px; background:#f2f4f4;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="border-collapse:collapse;">
                  <tr>
                    <td width="50%%" style="padding:0 32px 0 0; vertical-align:top;">
                      <div style="font-size:10px; line-height:14px; letter-spacing:0.16em; text-transform:uppercase; font-weight:700; color:#5a6061; margin-bottom:10px;">Shipping Address</div>
                      <div style="font-size:14px; line-height:24px; font-weight:600; color:#2d3435;">
                        %s<br/>
                        %s<br/>
                        %s, %s<br/>
                        %s
                      </div>
                    </td>
                    <td width="50%%" style="padding:0; vertical-align:top;">
                      <div style="font-size:10px; line-height:14px; letter-spacing:0.16em; text-transform:uppercase; font-weight:700; color:#5a6061; margin-bottom:10px;">Payment Method</div>
                      <div style="font-size:14px; line-height:24px; font-weight:600; color:#2d3435;">%s</div>
                      <div style="font-size:10px; line-height:14px; letter-spacing:0.16em; text-transform:uppercase; font-weight:700; color:#5a6061; margin:22px 0 10px;">Fulfillment</div>
                      <div style="font-size:14px; line-height:24px; font-weight:600; color:#2d3435;">%s</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            """.formatted(
            escapeHtml(order.customerName()),
            escapeHtml(order.shippingAddress().line1()),
            escapeHtml(order.shippingAddress().city()),
            escapeHtml(order.shippingAddress().postalCode()),
            escapeHtml(order.shippingAddress().country()),
            escapeHtml(order.paymentStatus()),
            escapeHtml(order.fulfillment())
        );
    }

    private String totalsSection(DomainModels.OrderDetail order, NumberFormat currency) {
        String discountRow = order.discount() > 0
            ? """
                <tr>
                  <td style="padding:0 0 10px; font-size:12px; line-height:18px; color:#5a6061;">Promo%s</td>
                  <td align="right" style="padding:0 0 10px; font-size:12px; line-height:18px; color:#5a6061;">-%s</td>
                </tr>
                """.formatted(
                order.promoCode() == null ? "" : " (" + escapeHtml(order.promoCode()) + ")",
                escapeHtml(currency.format(order.discount()))
            )
            : "";

        return """
            <tr>
              <td align="center" style="padding:42px 40px 48px; background:#f9f9f9;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="width:100%%; max-width:320px; border-collapse:collapse;">
                  <tr>
                    <td style="padding:0 0 10px; font-size:12px; line-height:18px; color:#5a6061;">Subtotal</td>
                    <td align="right" style="padding:0 0 10px; font-size:12px; line-height:18px; color:#5a6061;">%s</td>
                  </tr>
                  %s
                  <tr>
                    <td style="padding:0 0 10px; font-size:12px; line-height:18px; color:#5a6061;">Shipping</td>
                    <td align="right" style="padding:0 0 10px; font-size:12px; line-height:18px; color:#5a6061;">Complimentary</td>
                  </tr>
                  <tr>
                    <td style="padding:0 0 12px; font-size:12px; line-height:18px; color:#5a6061;">Estimated Tax</td>
                    <td align="right" style="padding:0 0 12px; font-size:12px; line-height:18px; color:#5a6061;">$0.00</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding:0 0 14px;">
                      <div style="height:1px; background:rgba(173,179,180,0.2);"></div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 0 26px; font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:22px; line-height:26px; font-weight:800; color:#2d3435;">Total</td>
                    <td align="right" style="padding:0 0 26px; font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:22px; line-height:26px; font-weight:800; color:#2d3435;">%s</td>
                  </tr>
                  <tr>
                    <td colspan="2" align="center" bgcolor="#5f5e5e">
                      <a href="%s" style="display:block; padding:16px 18px; font-family:Manrope, Inter, 'Segoe UI', Arial, sans-serif; font-size:14px; line-height:18px; font-weight:800; letter-spacing:0.02em; color:#faf7f7; text-decoration:none;">
                        View Order Details
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0; max-width:260px; font-size:11px; line-height:18px; color:#5a6061; text-align:center;">
                  Questions about your order? Reply to this email or visit our Help Center.
                </p>
              </td>
            </tr>
            """.formatted(
            escapeHtml(currency.format(order.subtotal())),
            discountRow,
            escapeHtml(currency.format(order.total())),
            attributeEscape(frontendUrl("/orders/" + order.id()))
        );
    }

    private String footerSection() {
        return """
            <tr>
              <td align="center" style="padding:32px; background:#f2f4f4;">
                <div style="font-size:10px; line-height:18px; letter-spacing:0.14em; text-transform:uppercase; color:#5a6061; margin-bottom:10px;">
                  © 2026 Tactile. Precision milled.
                </div>
                <div style="font-size:10px; line-height:18px; letter-spacing:0.14em; text-transform:uppercase; color:#5a6061;">
                  Privacy Policy&nbsp;&nbsp;&nbsp;Terms of Service&nbsp;&nbsp;&nbsp;Unsubscribe
                </div>
              </td>
            </tr>
            """;
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
