CREATE TABLE dbo.chat_threads (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    customer_user_id BIGINT NOT NULL,
    product_id BIGINT NULL,
    subject NVARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    last_message_at DATETIME2 NULL,
    last_message_preview NVARCHAR(500) NULL,
    last_message_sender_role VARCHAR(40) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_chat_threads_customer FOREIGN KEY (customer_user_id) REFERENCES dbo.app_users(id),
    CONSTRAINT FK_chat_threads_product FOREIGN KEY (product_id) REFERENCES dbo.products(id)
);

CREATE TABLE dbo.chat_messages (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    thread_id BIGINT NOT NULL,
    sender_user_id BIGINT NOT NULL,
    body NVARCHAR(4000) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_chat_messages_thread FOREIGN KEY (thread_id) REFERENCES dbo.chat_threads(id) ON DELETE CASCADE,
    CONSTRAINT FK_chat_messages_sender FOREIGN KEY (sender_user_id) REFERENCES dbo.app_users(id)
);

CREATE INDEX IX_chat_threads_customer_user_id ON dbo.chat_threads(customer_user_id);
CREATE INDEX IX_chat_threads_product_id ON dbo.chat_threads(product_id);
CREATE INDEX IX_chat_threads_last_message_at ON dbo.chat_threads(last_message_at DESC, updated_at DESC);
CREATE INDEX IX_chat_messages_thread_id ON dbo.chat_messages(thread_id, created_at, id);
