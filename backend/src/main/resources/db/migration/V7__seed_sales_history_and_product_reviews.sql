DECLARE @SeedOrders TABLE (
    order_number VARCHAR(40) PRIMARY KEY,
    external_user_id VARCHAR(120) NULL,
    customer_name VARCHAR(200) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    status VARCHAR(60) NOT NULL,
    fulfillment VARCHAR(255) NOT NULL,
    payment_status VARCHAR(60) NOT NULL,
    created_at DATETIME2 NOT NULL,
    shipping_line1 VARCHAR(255) NOT NULL,
    shipping_city VARCHAR(120) NOT NULL,
    shipping_postal_code VARCHAR(60) NOT NULL,
    shipping_country VARCHAR(120) NOT NULL,
    product_slug VARCHAR(160) NOT NULL,
    quantity INT NOT NULL,
    selected_options_json NVARCHAR(MAX) NOT NULL
);

INSERT INTO @SeedOrders (
    order_number,
    external_user_id,
    customer_name,
    customer_email,
    status,
    fulfillment,
    payment_status,
    created_at,
    shipping_line1,
    shipping_city,
    shipping_postal_code,
    shipping_country,
    product_slug,
    quantity,
    selected_options_json
)
VALUES
    ('TG-2120', 'user-atelier', 'Atelier Member', 'member@tactile.gallery', 'Delivered', 'Complete', 'Paid', '2025-11-05T10:10:00', '49 Charoen Nakhon Rd', 'Bangkok', '10600', 'Thailand', 'tactile-core-65', 1, '{"Switch Variant":"Cream Linear","Plate Material":"FR4"}'),
    ('TG-2121', 'customer-studio-north', 'Studio North', 'ops@studionorth.co', 'Delivered', 'Complete', 'Paid', '2025-11-09T14:20:00', '231 Soi Ari 4', 'Bangkok', '10400', 'Thailand', 'monolith-pro-tkl', 1, '{"Switch Variant":"Mistral Linear","Bottom Weight":"Powder-coated stone"}'),
    ('TG-2122', NULL, 'Mekha Office', 'orders@mekha-office.com', 'Delivered', 'Complete', 'Paid', '2025-11-14T09:45:00', '91 Rama IX Rd', 'Bangkok', '10310', 'Thailand', 'quiet-grid-keycap-set', 1, '{"Legend Style":"Standard"}'),
    ('TG-2123', 'customer-narin-p', 'Narin P.', 'narin@atelier.example', 'Delivered', 'Complete', 'Paid', '2025-11-20T16:10:00', '88 Sukhumvit 55', 'Bangkok', '10110', 'Thailand', 'atelier-desk-mat', 1, '{"Colorway":"Stone"}'),
    ('TG-2124', 'customer-lina-park', 'Lina Park', 'lina@ateliermail.com', 'Delivered', 'Complete', 'Paid', '2025-11-27T11:55:00', '18 Nimman Soi 7', 'Chiang Mai', '50200', 'Thailand', 'obsidian-tactile-switch-pack', 1, '{"Pack Size":"90 switches"}'),
    ('TG-2125', 'customer-quiet-works', 'Quiet Works', 'team@quietworks.dev', 'Delivered', 'Complete', 'Paid', '2025-12-03T13:00:00', '77 Wireless Rd', 'Bangkok', '10330', 'Thailand', 'monolith-pro-tkl', 1, '{"Switch Variant":"Mistral Linear","Bottom Weight":"Powder-coated stone"}'),
    ('TG-2126', NULL, 'Sora Tan', 'sora@linedesk.studio', 'Delivered', 'Complete', 'Paid', '2025-12-07T15:25:00', '12 Sathorn 11', 'Bangkok', '10120', 'Thailand', 'quiet-grid-keycap-set', 1, '{"Legend Style":"Blank alphas"}'),
    ('TG-2127', 'user-atelier', 'Atelier Member', 'member@tactile.gallery', 'Delivered', 'Complete', 'Paid', '2025-12-12T10:50:00', '49 Charoen Nakhon Rd', 'Bangkok', '10600', 'Thailand', 'brass-accent-plate', 1, '{"Layout":"65%"}'),
    ('TG-2128', 'customer-studio-north', 'Studio North', 'ops@studionorth.co', 'Delivered', 'Complete', 'Paid', '2025-12-18T09:15:00', '231 Soi Ari 4', 'Bangkok', '10400', 'Thailand', 'tactile-core-65', 1, '{"Switch Variant":"Obsidian Tactile","Plate Material":"FR4"}'),
    ('TG-2129', 'customer-lina-park', 'Lina Park', 'lina@ateliermail.com', 'Delivered', 'Complete', 'Paid', '2025-12-23T17:35:00', '18 Nimman Soi 7', 'Chiang Mai', '50200', 'Thailand', 'atelier-desk-mat', 1, '{"Colorway":"Ash"}'),
    ('TG-2130', 'customer-narin-p', 'Narin P.', 'narin@atelier.example', 'Delivered', 'Complete', 'Paid', '2026-01-04T12:05:00', '88 Sukhumvit 55', 'Bangkok', '10110', 'Thailand', 'quiet-grid-keycap-set', 1, '{"Legend Style":"Standard"}'),
    ('TG-2131', NULL, 'Frame Dept', 'procurement@framedept.co', 'Delivered', 'Complete', 'Paid', '2026-01-08T14:40:00', '5 Banthat Thong Rd', 'Bangkok', '10330', 'Thailand', 'brass-accent-plate', 1, '{"Layout":"TKL"}'),
    ('TG-2132', 'customer-quiet-works', 'Quiet Works', 'team@quietworks.dev', 'Delivered', 'Complete', 'Paid', '2026-01-13T10:30:00', '77 Wireless Rd', 'Bangkok', '10330', 'Thailand', 'obsidian-tactile-switch-pack', 1, '{"Pack Size":"90 switches"}'),
    ('TG-2133', 'user-atelier', 'Atelier Member', 'member@tactile.gallery', 'Delivered', 'Complete', 'Paid', '2026-01-21T16:45:00', '49 Charoen Nakhon Rd', 'Bangkok', '10600', 'Thailand', 'monolith-pro-tkl', 1, '{"Switch Variant":"Marble Tactile","Bottom Weight":"Powder-coated stone"}'),
    ('TG-2134', 'customer-studio-north', 'Studio North', 'ops@studionorth.co', 'Delivered', 'Complete', 'Paid', '2026-01-29T09:55:00', '231 Soi Ari 4', 'Bangkok', '10400', 'Thailand', 'atelier-desk-mat', 1, '{"Colorway":"Ash"}'),
    ('TG-2135', 'customer-lina-park', 'Lina Park', 'lina@ateliermail.com', 'Delivered', 'Complete', 'Paid', '2026-02-04T11:05:00', '18 Nimman Soi 7', 'Chiang Mai', '50200', 'Thailand', 'tactile-core-65', 1, '{"Switch Variant":"Cream Linear","Plate Material":"FR4"}'),
    ('TG-2136', NULL, 'North Block', 'hello@northblock.work', 'Delivered', 'Complete', 'Paid', '2026-02-09T15:20:00', '55 Phayathai Rd', 'Bangkok', '10400', 'Thailand', 'quiet-grid-keycap-set', 1, '{"Legend Style":"Standard"}'),
    ('TG-2137', 'customer-narin-p', 'Narin P.', 'narin@atelier.example', 'Delivered', 'Complete', 'Paid', '2026-02-14T13:30:00', '88 Sukhumvit 55', 'Bangkok', '10110', 'Thailand', 'brass-accent-plate', 1, '{"Layout":"65%"}'),
    ('TG-2138', 'customer-quiet-works', 'Quiet Works', 'team@quietworks.dev', 'Delivered', 'Complete', 'Paid', '2026-02-22T10:25:00', '77 Wireless Rd', 'Bangkok', '10330', 'Thailand', 'monolith-pro-tkl', 1, '{"Switch Variant":"Mistral Linear","Bottom Weight":"Powder-coated stone"}'),
    ('TG-2139', 'user-atelier', 'Atelier Member', 'member@tactile.gallery', 'Delivered', 'Complete', 'Paid', '2026-02-26T17:10:00', '49 Charoen Nakhon Rd', 'Bangkok', '10600', 'Thailand', 'atelier-desk-mat', 1, '{"Colorway":"Stone"}'),
    ('TG-2140', 'customer-studio-north', 'Studio North', 'ops@studionorth.co', 'Delivered', 'Complete', 'Paid', '2026-03-03T10:15:00', '231 Soi Ari 4', 'Bangkok', '10400', 'Thailand', 'tactile-core-65', 1, '{"Switch Variant":"Obsidian Tactile","Plate Material":"FR4"}'),
    ('TG-2141', NULL, 'Wireform Studio', 'team@wireformstudio.com', 'Delivered', 'Complete', 'Paid', '2026-03-09T14:05:00', '17 Chidlom Alley', 'Bangkok', '10330', 'Thailand', 'obsidian-tactile-switch-pack', 1, '{"Pack Size":"110 switches"}'),
    ('TG-2142', 'customer-lina-park', 'Lina Park', 'lina@ateliermail.com', 'Delivered', 'Complete', 'Paid', '2026-03-15T09:40:00', '18 Nimman Soi 7', 'Chiang Mai', '50200', 'Thailand', 'quiet-grid-keycap-set', 1, '{"Legend Style":"Standard"}'),
    ('TG-2143', 'customer-narin-p', 'Narin P.', 'narin@atelier.example', 'Delivered', 'Complete', 'Paid', '2026-03-21T11:35:00', '88 Sukhumvit 55', 'Bangkok', '10110', 'Thailand', 'atelier-desk-mat', 1, '{"Colorway":"Stone"}'),
    ('TG-2144', 'customer-quiet-works', 'Quiet Works', 'team@quietworks.dev', 'Delivered', 'Complete', 'Paid', '2026-03-28T16:20:00', '77 Wireless Rd', 'Bangkok', '10330', 'Thailand', 'brass-accent-plate', 1, '{"Layout":"TKL"}'),
    ('TG-2145', 'user-atelier', 'Atelier Member', 'member@tactile.gallery', 'Delivered', 'Complete', 'Paid', '2026-04-02T10:05:00', '49 Charoen Nakhon Rd', 'Bangkok', '10600', 'Thailand', 'monolith-pro-tkl', 1, '{"Switch Variant":"Mistral Linear","Bottom Weight":"Powder-coated stone"}'),
    ('TG-2146', 'customer-studio-north', 'Studio North', 'ops@studionorth.co', 'Ready to Ship', 'Packed and labeled', 'Paid', '2026-04-03T15:10:00', '231 Soi Ari 4', 'Bangkok', '10400', 'Thailand', 'quiet-grid-keycap-set', 1, '{"Legend Style":"Blank alphas"}'),
    ('TG-2147', NULL, 'Nook Works', 'ops@nookworks.space', 'Processing', 'Picking parts', 'Paid', '2026-04-04T11:45:00', '44 Sukhumvit 26', 'Bangkok', '10110', 'Thailand', 'atelier-desk-mat', 1, '{"Colorway":"Ash"}'),
    ('TG-2148', 'customer-lina-park', 'Lina Park', 'lina@ateliermail.com', 'Delivered', 'Complete', 'Paid', '2026-04-05T17:15:00', '18 Nimman Soi 7', 'Chiang Mai', '50200', 'Thailand', 'tactile-core-65', 1, '{"Switch Variant":"Cream Linear","Plate Material":"FR4"}'),
    ('TG-2149', 'customer-quiet-works', 'Quiet Works', 'team@quietworks.dev', 'Processing', 'Awaiting final packing', 'Paid', '2026-04-06T13:55:00', '77 Wireless Rd', 'Bangkok', '10330', 'Thailand', 'obsidian-tactile-switch-pack', 1, '{"Pack Size":"90 switches"}');

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
SELECT
    seed.order_number,
    userEntity.id,
    seed.customer_name,
    seed.customer_email,
    seed.status,
    p.price * seed.quantity,
    seed.quantity,
    seed.fulfillment,
    seed.shipping_line1,
    seed.shipping_city,
    seed.shipping_postal_code,
    seed.shipping_country,
    seed.payment_status,
    seed.created_at
FROM @SeedOrders seed
JOIN dbo.products p ON p.slug = seed.product_slug
LEFT JOIN dbo.app_users userEntity ON userEntity.external_id = seed.external_user_id
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.orders existing
    WHERE existing.order_number = seed.order_number
);

INSERT INTO dbo.order_timeline_entries (order_id, timeline_text, sort_order, created_at)
SELECT
    o.id,
    timeline.timeline_text,
    timeline.sort_order,
    DATEADD(MINUTE, timeline.sort_order * 35, o.created_at)
FROM dbo.orders o
JOIN @SeedOrders seed ON seed.order_number = o.order_number
CROSS APPLY (
    VALUES
        ('Order placed', 1),
        (CASE WHEN seed.status = 'Processing' THEN 'Payment captured' ELSE 'Assembly completed' END, 2),
        (CASE WHEN seed.status = 'Delivered' THEN 'Delivered' ELSE seed.fulfillment END, 3)
) timeline(timeline_text, sort_order)
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.order_timeline_entries existing
    WHERE existing.order_id = o.id
      AND existing.sort_order = timeline.sort_order
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
    p.slug,
    p.name,
    p.image_src,
    p.image_alt,
    p.price,
    seed.quantity,
    seed.selected_options_json
FROM dbo.orders o
JOIN @SeedOrders seed ON seed.order_number = o.order_number
JOIN dbo.products p ON p.slug = seed.product_slug
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.order_items existing
    WHERE existing.order_id = o.id
      AND existing.product_slug = p.slug
      AND existing.selected_options_json = seed.selected_options_json
);

DECLARE @SeedReviews TABLE (
    external_user_id VARCHAR(120) NOT NULL,
    product_slug VARCHAR(160) NOT NULL,
    rating INT NOT NULL,
    comment VARCHAR(2000) NOT NULL,
    status VARCHAR(40) NOT NULL,
    admin_note VARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL,
    reviewed_at DATETIME2 NULL
);

INSERT INTO @SeedReviews (
    external_user_id,
    product_slug,
    rating,
    comment,
    status,
    admin_note,
    created_at,
    reviewed_at
)
VALUES
    ('user-atelier', 'monolith-pro-tkl', 5, 'Quiet, dense, and very controlled. The board feels stable through long writing sessions.', 'Approved', 'Published after admin check.', '2026-01-24T18:10:00', '2026-01-25T09:00:00'),
    ('user-atelier', 'atelier-desk-mat', 4, 'Cuts desk noise well and keeps heavier boards visually grounded.', 'Approved', 'Published after admin check.', '2026-03-24T13:00:00', '2026-03-25T10:00:00'),
    ('customer-studio-north', 'tactile-core-65', 5, 'Clean finish, stable acoustics, and no surprises in daily use.', 'Approved', 'Published after admin check.', '2026-03-05T11:20:00', '2026-03-06T09:40:00'),
    ('customer-studio-north', 'atelier-desk-mat', 4, 'Works well under heavier boards and keeps the desk looking tidy.', 'Pending', NULL, '2026-04-06T18:00:00', NULL),
    ('customer-narin-p', 'quiet-grid-keycap-set', 5, 'Legends are restrained and the texture feels consistent across the full set.', 'Approved', 'Published after admin check.', '2026-04-03T17:30:00', '2026-04-04T10:15:00'),
    ('customer-quiet-works', 'brass-accent-plate', 4, 'Added weight and a brighter note exactly where we expected.', 'Pending', NULL, '2026-04-07T14:10:00', NULL),
    ('customer-lina-park', 'tactile-core-65', 5, 'Very composed sound profile and the 65 layout suits long sessions.', 'Approved', 'Published after admin check.', '2026-04-06T19:00:00', '2026-04-07T08:45:00');

INSERT INTO dbo.product_reviews (
    product_id,
    user_id,
    rating,
    comment,
    status,
    admin_note,
    created_at,
    updated_at,
    reviewed_at
)
SELECT
    p.id,
    u.id,
    seed.rating,
    seed.comment,
    seed.status,
    seed.admin_note,
    seed.created_at,
    COALESCE(seed.reviewed_at, seed.created_at),
    seed.reviewed_at
FROM @SeedReviews seed
JOIN dbo.app_users u ON u.external_id = seed.external_user_id
JOIN dbo.products p ON p.slug = seed.product_slug
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.product_reviews existing
    WHERE existing.product_id = p.id
      AND existing.user_id = u.id
);
