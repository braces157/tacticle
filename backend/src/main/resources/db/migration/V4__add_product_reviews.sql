CREATE TABLE dbo.product_reviews (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    product_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    rating INT NOT NULL,
    comment VARCHAR(2000) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'Pending',
    admin_note VARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    reviewed_at DATETIME2 NULL,
    CONSTRAINT FK_product_reviews_product FOREIGN KEY (product_id) REFERENCES dbo.products(id) ON DELETE CASCADE,
    CONSTRAINT FK_product_reviews_user FOREIGN KEY (user_id) REFERENCES dbo.app_users(id) ON DELETE CASCADE,
    CONSTRAINT CK_product_reviews_rating CHECK (rating BETWEEN 1 AND 5)
);

CREATE INDEX IX_product_reviews_product_id ON dbo.product_reviews(product_id);
CREATE INDEX IX_product_reviews_status ON dbo.product_reviews(status);
