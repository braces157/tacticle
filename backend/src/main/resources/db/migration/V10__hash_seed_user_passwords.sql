UPDATE dbo.app_users
SET password_hash = '$2a$10$NjaMJyYp90K9Fuphgl3Nd.6TRX0.w9r/cklOK9szj7Ff11woH/rba'
WHERE external_id IN (
    'user-atelier',
    'admin-tactile',
    'customer-studio-north',
    'customer-narin-p',
    'customer-quiet-works',
    'customer-lina-park',
    'customer-suda-lee'
)
AND password_hash = 'quiet';
