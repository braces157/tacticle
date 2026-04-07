ALTER TABLE dbo.user_profiles
ADD
    phone VARCHAR(80) NULL,
    shipping_line1 VARCHAR(255) NULL,
    shipping_city VARCHAR(120) NULL,
    shipping_postal_code VARCHAR(60) NULL,
    shipping_country VARCHAR(120) NULL,
    billing_line1 VARCHAR(255) NULL,
    billing_city VARCHAR(120) NULL,
    billing_postal_code VARCHAR(60) NULL,
    billing_country VARCHAR(120) NULL;

GO

WITH latest_orders AS (
    SELECT
        o.user_id,
        o.shipping_line1,
        o.shipping_city,
        o.shipping_postal_code,
        o.shipping_country,
        ROW_NUMBER() OVER (PARTITION BY o.user_id ORDER BY o.created_at DESC, o.id DESC) AS row_num
    FROM dbo.orders o
    WHERE o.user_id IS NOT NULL
)
UPDATE profile
SET
    shipping_line1 = latest.shipping_line1,
    shipping_city = latest.shipping_city,
    shipping_postal_code = latest.shipping_postal_code,
    shipping_country = latest.shipping_country,
    billing_line1 = latest.shipping_line1,
    billing_city = latest.shipping_city,
    billing_postal_code = latest.shipping_postal_code,
    billing_country = latest.shipping_country
FROM dbo.user_profiles profile
JOIN latest_orders latest
    ON latest.user_id = profile.user_id
   AND latest.row_num = 1;
