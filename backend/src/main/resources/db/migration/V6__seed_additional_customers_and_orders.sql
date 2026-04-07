    IF NOT EXISTS (SELECT 1 FROM dbo.app_users WHERE external_id = 'customer-studio-north')
BEGIN
    INSERT INTO dbo.app_users (external_id, name, email, password_hash, role, enabled, created_at)
    VALUES ('customer-studio-north', 'Studio North', 'ops@studionorth.co', 'quiet', 'customer', 1, '2026-03-10T09:00:00');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.app_users WHERE external_id = 'customer-narin-p')
BEGIN
    INSERT INTO dbo.app_users (external_id, name, email, password_hash, role, enabled, created_at)
    VALUES ('customer-narin-p', 'Narin P.', 'narin@atelier.example', 'quiet', 'customer', 1, '2026-03-12T11:15:00');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.app_users WHERE external_id = 'customer-quiet-works')
BEGIN
    INSERT INTO dbo.app_users (external_id, name, email, password_hash, role, enabled, created_at)
    VALUES ('customer-quiet-works', 'Quiet Works', 'team@quietworks.dev', 'quiet', 'customer', 1, '2026-03-18T14:45:00');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.app_users WHERE external_id = 'customer-lina-park')
BEGIN
    INSERT INTO dbo.app_users (external_id, name, email, password_hash, role, enabled, created_at)
    VALUES ('customer-lina-park', 'Lina Park', 'lina@ateliermail.com', 'quiet', 'customer', 1, '2026-03-22T08:30:00');
END;

IF NOT EXISTS (
    SELECT 1
    FROM dbo.user_profiles up
    JOIN dbo.app_users au ON au.id = up.user_id
    WHERE au.external_id = 'customer-studio-north'
)
BEGIN
    INSERT INTO dbo.user_profiles (user_id, location, membership, created_at, updated_at)
    SELECT id, 'Bangkok, Thailand', 'Studio Account', '2026-03-10T09:05:00', '2026-03-10T09:05:00'
    FROM dbo.app_users
    WHERE external_id = 'customer-studio-north';
END;

IF NOT EXISTS (
    SELECT 1
    FROM dbo.user_profiles up
    JOIN dbo.app_users au ON au.id = up.user_id
    WHERE au.external_id = 'customer-narin-p'
)
BEGIN
    INSERT INTO dbo.user_profiles (user_id, location, membership, created_at, updated_at)
    SELECT id, 'Bangkok, Thailand', 'Collector Circle', '2026-03-12T11:20:00', '2026-03-12T11:20:00'
    FROM dbo.app_users
    WHERE external_id = 'customer-narin-p';
END;

IF NOT EXISTS (
    SELECT 1
    FROM dbo.user_profiles up
    JOIN dbo.app_users au ON au.id = up.user_id
    WHERE au.external_id = 'customer-quiet-works'
)
BEGIN
    INSERT INTO dbo.user_profiles (user_id, location, membership, created_at, updated_at)
    SELECT id, 'Bangkok, Thailand', 'Trade Customer', '2026-03-18T14:50:00', '2026-03-18T14:50:00'
    FROM dbo.app_users
    WHERE external_id = 'customer-quiet-works';
END;

IF NOT EXISTS (
    SELECT 1
    FROM dbo.user_profiles up
    JOIN dbo.app_users au ON au.id = up.user_id
    WHERE au.external_id = 'customer-lina-park'
)
BEGIN
    INSERT INTO dbo.user_profiles (user_id, location, membership, created_at, updated_at)
    SELECT id, 'Chiang Mai, Thailand', 'Gallery Member since 2025', '2026-03-22T08:35:00', '2026-03-22T08:35:00'
    FROM dbo.app_users
    WHERE external_id = 'customer-lina-park';
END;

INSERT INTO dbo.user_preferences (user_profile_id, preference_text, sort_order)
SELECT up.id, source.preference_text, source.sort_order
FROM dbo.user_profiles up
JOIN dbo.app_users au ON au.id = up.user_id
JOIN (
    VALUES
        ('customer-studio-north', 'TKL layouts', 1),
        ('customer-studio-north', 'Low-noise builds', 2),
        ('customer-studio-north', 'Desk mats', 3),
        ('customer-narin-p', 'Keycap sets', 1),
        ('customer-narin-p', 'Warm material finishes', 2),
        ('customer-narin-p', 'Compact desk setups', 3),
        ('customer-quiet-works', 'Builder parts', 1),
        ('customer-quiet-works', 'Switch tuning', 2),
        ('customer-quiet-works', 'Plate swaps', 3),
        ('customer-lina-park', '65% keyboards', 1),
        ('customer-lina-park', 'Quiet tactility', 2),
        ('customer-lina-park', 'Neutral colorways', 3)
) source(external_id, preference_text, sort_order) ON source.external_id = au.external_id
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.user_preferences existing
    WHERE existing.user_profile_id = up.id
      AND existing.sort_order = source.sort_order
);

UPDATE o
SET user_id = au.id
FROM dbo.orders o
JOIN dbo.app_users au ON au.email = o.customer_email
WHERE o.user_id IS NULL
  AND o.customer_email IN ('ops@studionorth.co', 'narin@atelier.example', 'team@quietworks.dev');

IF NOT EXISTS (SELECT 1 FROM dbo.orders WHERE order_number = 'TG-2102')
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
        'TG-2102',
        (SELECT id FROM dbo.app_users WHERE external_id = 'customer-lina-park'),
        'Lina Park',
        'lina@ateliermail.com',
        'Delivered',
        488.00,
        2,
        'Complete',
        '18 Nimman Soi 7',
        'Chiang Mai',
        '50200',
        'Thailand',
        'Paid',
        '2026-04-06T10:20:00'
    );
END;

IF NOT EXISTS (SELECT 1 FROM dbo.orders WHERE order_number = 'TG-2105')
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
        'TG-2105',
        (SELECT id FROM dbo.app_users WHERE external_id = 'customer-studio-north'),
        'Studio North',
        'ops@studionorth.co',
        'Delivered',
        153.00,
        2,
        'Complete',
        '231 Soi Ari 4',
        'Bangkok',
        '10400',
        'Thailand',
        'Paid',
        '2026-04-06T16:00:00'
    );
END;

IF NOT EXISTS (SELECT 1 FROM dbo.orders WHERE order_number = 'TG-2110')
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
        'TG-2110',
        (SELECT id FROM dbo.app_users WHERE external_id = 'customer-narin-p'),
        'Narin P.',
        'narin@atelier.example',
        'Delivered',
        133.00,
        2,
        'Complete',
        '88 Sukhumvit 55',
        'Bangkok',
        '10110',
        'Thailand',
        'Paid',
        '2026-04-07T09:40:00'
    );
END;

IF NOT EXISTS (SELECT 1 FROM dbo.orders WHERE order_number = 'TG-2113')
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
        'TG-2113',
        (SELECT id FROM dbo.app_users WHERE external_id = 'customer-quiet-works'),
        'Quiet Works',
        'team@quietworks.dev',
        'Processing',
        116.00,
        2,
        'Awaiting final packing',
        '77 Wireless Rd',
        'Bangkok',
        '10330',
        'Thailand',
        'Paid',
        '2026-04-07T12:15:00'
    );
END;

INSERT INTO dbo.order_timeline_entries (order_id, timeline_text, sort_order, created_at)
SELECT o.id, source.timeline_text, source.sort_order, o.created_at
FROM dbo.orders o
JOIN (
    VALUES
        ('TG-2102', 'Order placed', 1),
        ('TG-2102', 'Assembly completed', 2),
        ('TG-2102', 'Delivered', 3),
        ('TG-2105', 'Order placed', 1),
        ('TG-2105', 'Assembly completed', 2),
        ('TG-2105', 'Delivered', 3),
        ('TG-2110', 'Order placed', 1),
        ('TG-2110', 'Packed', 2),
        ('TG-2110', 'Delivered', 3),
        ('TG-2113', 'Order placed', 1),
        ('TG-2113', 'Payment captured', 2),
        ('TG-2113', 'Awaiting final packing', 3)
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
        ('TG-2102', 'tactile-core-65', 'Tactile Core-65', 'https://lh3.googleusercontent.com/aida-public/AB6AXuADzc-N6PUKuzJ7AXZ-i8XLTCCFOpIyGfPIr5YlwWhIJL5p4w0Y0lPtyb41grgiWEcKlHkV-k3UVDncc3_tDHF_vLix5utI710K2YXHQKwm4aqaBYFuw_s2cp-D-70wwkf86hdrRpVNegdq3IkqbpaXNwR0sc1jmQOofFc-GorAZy2ktc_d0DTuIRYS6jFT7yeq6r6UuAJEuX0ZqLAnWxkv4LAKaHBhaxOrX5MbKkSPsfU7ylNfsqcDe2g0Kbfo2rzGEMM_Hss_UxM', 'Tactile Core-65 preview.', 420.00, 1, '{"Switch Variant":"Cream Linear","Plate Material":"FR4"}'),
        ('TG-2102', 'obsidian-tactile-switch-pack', 'Obsidian Tactile Switch Pack', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQxiVTz86ehaz_BMK6njc7mThLkBnPxB75mroO_h_z1xZIWABgNzFOY7zrXWku6Mrlc5eXTt_CJYFKTPuau6dKd1QLFIcP-ov90oo2ws3KokX_ppCx3ivU8HZzHl6sNiM5-8_5sP18v_R_HUZ3h4FN_9s4yke53I51RNxowmatzwirmG_lpRUkWSV3xWrayns2DvTineikWyHLMCid9KXHKoqqDpOAdApT8IsNFCk-hxZkBD3SSOSBv58HFYpTZksreeWIHCVubks', 'Obsidian Tactile Switch Pack preview.', 68.00, 1, '{"Pack Size":"110 switches"}'),
        ('TG-2105', 'quiet-grid-keycap-set', 'Quiet Grid Keycap Set', 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6D96WQNSExc7laAdPQf4j-q3x8Erc-IB6-rn875IPMhgu78a3-xOvUomYfCOTFhQ9sVWduMDe2X5lL8Ttz0VvNFgw-Gb6eWgoLf8Hp21vbqNTxfkVY-TtWhNtsInOagLDzg-UHVIKHWQKO6bQ1GULGYe_c-zv8SplWzvVCtg6bERuoan6KqdbZoxPBHJ7DdZ8i7Ia4X7aNk2jpoVI0ZlFybICmy-kMHDxggkDvv3mWFBXQ8XfsXBexZENjQJh7EayqzNBgT1CMmU', 'Quiet Grid Keycap Set preview.', 95.00, 1, '{"Legend Style":"Blank alphas"}'),
        ('TG-2105', 'atelier-desk-mat', 'Atelier Desk Mat', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzLHT59nxB33Z9pDwHPlvCTQqCr4WixIAjgCatmbHFIxChR2fWv__bBZ3TIVzxE32yeuf90LKFNE4D30Cih2ZV4vZgEJ7kyr9wucmJ9kg8Gun4HXFER2FZj8BAkA44sc7a7oi3uRkrOHf3IKgCRB3T3u-nHyqsLVWdhUPljoHTzA_vlVseE79DK68kXBnuGsu2jwp5Rp9T762HI3o5jSwuBr_bHvPnO1TZiDgQrDkR0J8vgcpeyn-JDeDiHJ1F-x-WNF18WKkNBXo', 'Atelier Desk Mat preview.', 58.00, 1, '{"Colorway":"Ash"}'),
        ('TG-2110', 'atelier-desk-mat', 'Atelier Desk Mat', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzLHT59nxB33Z9pDwHPlvCTQqCr4WixIAjgCatmbHFIxChR2fWv__bBZ3TIVzxE32yeuf90LKFNE4D30Cih2ZV4vZgEJ7kyr9wucmJ9kg8Gun4HXFER2FZj8BAkA44sc7a7oi3uRkrOHf3IKgCRB3T3u-nHyqsLVWdhUPljoHTzA_vlVseE79DK68kXBnuGsu2jwp5Rp9T762HI3o5jSwuBr_bHvPnO1TZiDgQrDkR0J8vgcpeyn-JDeDiHJ1F-x-WNF18WKkNBXo', 'Atelier Desk Mat preview.', 68.00, 1, '{"Colorway":"Stone"}'),
        ('TG-2110', 'brass-accent-plate', 'Brass Accent Plate', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3inaalLfE5sedHjD-QKU1324XRS_2rzkVnuEKLrR4_aCj95CmeJcamttXrKApS7JxkqN8issdeKSJVoizU2KC1M_VyHyHVFLRYvVh8Ia4Hr8br1XxU1RWwtrgGS560fP1rf4FeZ89oND2CFWlOy_tTgNyiF7egU0RQmVTF-3PDVW1L7s1-NZyM7EbNqUFptf37rBgBFBTVCJHTFNq6gQGBW9toms1dHwS0vGWzT2tvsTKmhGDxOOBPPKMJXVXi5PrWP2hdsuTDZ8', 'Brass Accent Plate preview.', 65.00, 1, '{"Layout":"65%"}'),
        ('TG-2113', 'obsidian-tactile-switch-pack', 'Obsidian Tactile Switch Pack', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQxiVTz86ehaz_BMK6njc7mThLkBnPxB75mroO_h_z1xZIWABgNzFOY7zrXWku6Mrlc5eXTt_CJYFKTPuau6dKd1QLFIcP-ov90oo2ws3KokX_ppCx3ivU8HZzHl6sNiM5-8_5sP18v_R_HUZ3h4FN_9s4yke53I51RNxowmatzwirmG_lpRUkWSV3xWrayns2DvTineikWyHLMCid9KXHKoqqDpOAdApT8IsNFCk-hxZkBD3SSOSBv58HFYpTZksreeWIHCVubks', 'Obsidian Tactile Switch Pack preview.', 58.00, 1, '{"Pack Size":"90 switches"}'),
        ('TG-2113', 'brass-accent-plate', 'Brass Accent Plate', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3inaalLfE5sedHjD-QKU1324XRS_2rzkVnuEKLrR4_aCj95CmeJcamttXrKApS7JxkqN8issdeKSJVoizU2KC1M_VyHyHVFLRYvVh8Ia4Hr8br1XxU1RWwtrgGS560fP1rf4FeZ89oND2CFWlOy_tGgNyiF7egU0RQmVTF-3PDVW1L7s1-NZyM7EbNqUFptf37rBgBFBTVCJHTFNq6gQGBW9toms1dHwS0vGWzT2tvsTKmhGDxOOBPPKMJXVXi5PrWP2hdsuTDZ8', 'Brass Accent Plate preview.', 58.00, 1, '{"Layout":"60% / 65%"}')
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
