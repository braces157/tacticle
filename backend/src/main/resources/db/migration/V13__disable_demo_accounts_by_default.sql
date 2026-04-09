IF '${demoAccountsEnabled}' <> 'true'
BEGIN
    UPDATE dbo.app_users
    SET enabled = 0
    WHERE external_id IN (
        'user-atelier',
        'admin-tactile',
        'customer-studio-north',
        'customer-narin-p',
        'customer-quiet-works',
        'customer-lina-park',
        'customer-suda-lee'
    );
END;
