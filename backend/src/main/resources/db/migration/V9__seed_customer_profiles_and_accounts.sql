IF NOT EXISTS (SELECT 1 FROM dbo.app_users WHERE external_id = 'customer-suda-lee')
BEGIN
    INSERT INTO dbo.app_users (external_id, name, email, password_hash, role, enabled, created_at)
    VALUES ('customer-suda-lee', 'Suda Lee', 'suda@ateliermail.com', 'quiet', 'customer', 1, '2026-04-01T09:10:00');
END;

IF NOT EXISTS (
    SELECT 1
    FROM dbo.user_profiles up
    JOIN dbo.app_users au ON au.id = up.user_id
    WHERE au.external_id = 'customer-suda-lee'
)
BEGIN
    INSERT INTO dbo.user_profiles (
        user_id,
        location,
        phone,
        membership,
        shipping_line1,
        shipping_city,
        shipping_postal_code,
        shipping_country,
        billing_line1,
        billing_city,
        billing_postal_code,
        billing_country,
        created_at,
        updated_at
    )
    SELECT
        id,
        'Bangkok, Thailand',
        '+66 89 410 2244',
        'Gallery Member since 2026',
        '312 Rama IV Rd',
        'Bangkok',
        '10500',
        'Thailand',
        '312 Rama IV Rd',
        'Bangkok',
        '10500',
        'Thailand',
        '2026-04-01T09:15:00',
        '2026-04-01T09:15:00'
    FROM dbo.app_users
    WHERE external_id = 'customer-suda-lee';
END;

INSERT INTO dbo.user_preferences (user_profile_id, preference_text, sort_order)
SELECT up.id, source.preference_text, source.sort_order
FROM dbo.user_profiles up
JOIN dbo.app_users au ON au.id = up.user_id
JOIN (
    VALUES
        ('customer-suda-lee', 'Wireless keyboards', 1),
        ('customer-suda-lee', 'Warm brass accents', 2),
        ('customer-suda-lee', 'Desk acoustics', 3)
) source(external_id, preference_text, sort_order) ON source.external_id = au.external_id
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.user_preferences existing
    WHERE existing.user_profile_id = up.id
      AND existing.sort_order = source.sort_order
);

UPDATE up
SET
    phone = source.phone,
    shipping_line1 = source.shipping_line1,
    shipping_city = source.shipping_city,
    shipping_postal_code = source.shipping_postal_code,
    shipping_country = source.shipping_country,
    billing_line1 = source.billing_line1,
    billing_city = source.billing_city,
    billing_postal_code = source.billing_postal_code,
    billing_country = source.billing_country,
    updated_at = '2026-04-07T08:00:00'
FROM dbo.user_profiles up
JOIN dbo.app_users au ON au.id = up.user_id
JOIN (
    VALUES
        ('user-atelier', '+66 81 245 0041', '49 Charoen Nakhon Rd', 'Bangkok', '10600', 'Thailand', '49 Charoen Nakhon Rd', 'Bangkok', '10600', 'Thailand'),
        ('customer-studio-north', '+66 92 777 1400', '231 Soi Ari 4', 'Bangkok', '10400', 'Thailand', '231 Soi Ari 4', 'Bangkok', '10400', 'Thailand'),
        ('customer-narin-p', '+66 94 310 8821', '88 Sukhumvit 55', 'Bangkok', '10110', 'Thailand', '88 Sukhumvit 55', 'Bangkok', '10110', 'Thailand'),
        ('customer-quiet-works', '+66 95 440 1200', '77 Wireless Rd', 'Bangkok', '10330', 'Thailand', '77 Wireless Rd', 'Bangkok', '10330', 'Thailand'),
        ('customer-lina-park', '+66 98 610 4422', '18 Nimman Soi 7', 'Chiang Mai', '50200', 'Thailand', '18 Nimman Soi 7', 'Chiang Mai', '50200', 'Thailand')
) source(external_id, phone, shipping_line1, shipping_city, shipping_postal_code, shipping_country, billing_line1, billing_city, billing_postal_code, billing_country)
    ON source.external_id = au.external_id;

IF NOT EXISTS (SELECT 1 FROM dbo.orders WHERE order_number = 'TG-2116')
BEGIN
    INSERT INTO dbo.orders (
        order_number,
        user_id,
        customer_name,
        customer_email,
        status,
        total_amount,
        item_count,
        fulfillment,
        shipping_line1,
        shipping_city,
        shipping_postal_code,
        shipping_country,
        payment_status,
        created_at
    )
    VALUES (
        'TG-2116',
        (SELECT id FROM dbo.app_users WHERE external_id = 'customer-suda-lee'),
        'Suda Lee',
        'suda@ateliermail.com',
        'Processing',
        488.00,
        2,
        'Assembly queued',
        '312 Rama IV Rd',
        'Bangkok',
        '10500',
        'Thailand',
        'Paid',
        '2026-04-07T13:20:00'
    );
END;

INSERT INTO dbo.order_timeline_entries (order_id, timeline_text, sort_order, created_at)
SELECT o.id, source.timeline_text, source.sort_order, o.created_at
FROM dbo.orders o
JOIN (
    VALUES
        ('TG-2116', 'Order placed', 1),
        ('TG-2116', 'Payment captured', 2),
        ('TG-2116', 'Assembly queued', 3)
) source(order_number, timeline_text, sort_order) ON source.order_number = o.order_number
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.order_timeline_entries existing
    WHERE existing.order_id = o.id
      AND existing.sort_order = source.sort_order
);

INSERT INTO dbo.order_items (
    order_id,
    product_id,
    product_slug,
    product_name,
    image_src,
    image_alt,
    unit_price,
    quantity,
    selected_options_json
)
SELECT
    o.id,
    p.id,
    source.product_slug,
    source.product_name,
    source.image_src,
    source.image_alt,
    source.unit_price,
    source.quantity,
    source.selected_options_json
FROM dbo.orders o
JOIN (
    VALUES
        ('TG-2116', 'tactile-core-65', 'Tactile Core-65', 'https://lh3.googleusercontent.com/aida-public/AB6AXuADzc-N6PUKuzJ7AXZ-i8XLTCCFOpIyGfPIr5YlwWhIJL5p4w0Y0lPtyb41grgiWEcKlHkV-k3UVDncc3_tDHF_vLix5utI710K2YXHQKwm4aqaBYFuw_s2cp-D-70wwkf86hdrRpVNegdq3IkqbpaXNwR0sc1jmQOofFc-GorAZy2ktc_d0DTuIRYS6jFT7yeq6r6UuAJEuX0ZqLAnWxkv4LAKaHBhaxOrX5MbKkSPsfU7ylNfsqcDe2g0Kbfo2rzGEMM_Hss_UxM', 'Tactile Core-65 preview.', 420.00, 1, '{"Switch Variant":"Obsidian Tactile","Plate Material":"Brass"}'),
        ('TG-2116', 'atelier-desk-mat', 'Atelier Desk Mat', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzLHT59nxB33Z9pDwHPlvCTQqCr4WixIAjgCatmbHFIxChR2fWv__bBZ3TIVzxE32yeuf90LKFNE4D30Cih2ZV4vZgEJ7kyr9wucmJ9kg8Gun4HXFER2FZj8BAkA44sc7a7oi3uRkrOHf3IKgCRB3T3u-nHyqsLVWdhUPljoHTzA_vlVseE79DK68kXBnuGsu2jwp5Rp9T762HI3o5jSwuBr_bHvPnO1TZiDgQrDkR0J8vgcpeyn-JDeDiHJ1F-x-WNF18WKkNBXo', 'Atelier Desk Mat preview.', 68.00, 1, '{"Colorway":"Ash"}')
) source(order_number, product_slug, product_name, image_src, image_alt, unit_price, quantity, selected_options_json)
    ON source.order_number = o.order_number
JOIN dbo.products p ON p.slug = source.product_slug
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.order_items existing
    WHERE existing.order_id = o.id
      AND existing.product_slug = source.product_slug
      AND existing.selected_options_json = source.selected_options_json
);
