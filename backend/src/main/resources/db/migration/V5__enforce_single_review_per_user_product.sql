CREATE UNIQUE INDEX UX_product_reviews_product_user
ON dbo.product_reviews(product_id, user_id);
