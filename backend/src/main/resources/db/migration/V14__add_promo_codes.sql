CREATE TABLE dbo.promo_codes (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    code VARCHAR(80) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    discount_type VARCHAR(40) NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_subtotal DECIMAL(10,2) NOT NULL CONSTRAINT DF_promo_codes_minimum_subtotal DEFAULT 0,
    usage_limit INT NULL,
    usage_count INT NOT NULL CONSTRAINT DF_promo_codes_usage_count DEFAULT 0,
    active BIT NOT NULL CONSTRAINT DF_promo_codes_active DEFAULT 1,
    starts_at DATETIME2 NULL,
    ends_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_promo_codes_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_promo_codes_updated_at DEFAULT SYSUTCDATETIME()
);

ALTER TABLE dbo.orders
ADD subtotal_amount DECIMAL(10,2) NULL,
    discount_amount DECIMAL(10,2) NOT NULL CONSTRAINT DF_orders_discount_amount DEFAULT 0,
    promo_code VARCHAR(80) NULL;

EXEC('UPDATE dbo.orders SET subtotal_amount = total_amount WHERE subtotal_amount IS NULL');

EXEC('ALTER TABLE dbo.orders ALTER COLUMN subtotal_amount DECIMAL(10,2) NOT NULL');

IF NOT EXISTS (SELECT 1 FROM dbo.promo_codes WHERE code = 'WELCOME10')
BEGIN
    INSERT INTO dbo.promo_codes (
        code,
        description,
        discount_type,
        discount_value,
        minimum_subtotal,
        usage_limit,
        usage_count,
        active
    ) VALUES (
        'WELCOME10',
        '10% off first atelier order',
        'PERCENTAGE',
        10.00,
        150.00,
        NULL,
        0,
        1
    );
END;

IF NOT EXISTS (SELECT 1 FROM dbo.promo_codes WHERE code = 'QUIET50')
BEGIN
    INSERT INTO dbo.promo_codes (
        code,
        description,
        discount_type,
        discount_value,
        minimum_subtotal,
        usage_limit,
        usage_count,
        active
    ) VALUES (
        'QUIET50',
        '$50 off orders above $400',
        'FIXED',
        50.00,
        400.00,
        NULL,
        0,
        1
    );
END;
