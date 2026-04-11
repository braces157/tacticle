ALTER TABLE dbo.app_users
ADD token_version INT NOT NULL CONSTRAINT DF_app_users_token_version DEFAULT 0;
