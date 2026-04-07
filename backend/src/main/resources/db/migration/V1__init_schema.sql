CREATE TABLE dbo.categories (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    slug VARCHAR(120) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    kicker VARCHAR(120) NOT NULL,
    headline VARCHAR(255) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    story VARCHAR(2000) NOT NULL,
    hero_image_src VARCHAR(1000) NOT NULL,
    hero_image_alt VARCHAR(255) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.products (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    slug VARCHAR(160) NOT NULL UNIQUE,
    category_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    subtitle VARCHAR(400) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    story VARCHAR(3000) NOT NULL,
    material VARCHAR(120) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image_src VARCHAR(1000) NOT NULL,
    image_alt VARCHAR(255) NOT NULL,
    sku VARCHAR(120) NOT NULL UNIQUE,
    stock INT NOT NULL DEFAULT 0,
    visibility VARCHAR(40) NOT NULL DEFAULT 'Active',
    archived BIT NOT NULL DEFAULT 0,
    featured BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_products_category FOREIGN KEY (category_id) REFERENCES dbo.categories(id)
);

CREATE TABLE dbo.product_tags (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    product_id BIGINT NOT NULL,
    tag VARCHAR(120) NOT NULL,
    CONSTRAINT FK_product_tags_product FOREIGN KEY (product_id) REFERENCES dbo.products(id) ON DELETE CASCADE
);

CREATE TABLE dbo.product_images (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    product_id BIGINT NOT NULL,
    image_src VARCHAR(1000) NOT NULL,
    image_alt VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_product_images_product FOREIGN KEY (product_id) REFERENCES dbo.products(id) ON DELETE CASCADE
);

CREATE TABLE dbo.product_specs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    product_id BIGINT NOT NULL,
    spec_label VARCHAR(120) NOT NULL,
    spec_value VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_product_specs_product FOREIGN KEY (product_id) REFERENCES dbo.products(id) ON DELETE CASCADE
);

CREATE TABLE dbo.product_highlights (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    product_id BIGINT NOT NULL,
    highlight_text VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_product_highlights_product FOREIGN KEY (product_id) REFERENCES dbo.products(id) ON DELETE CASCADE
);

CREATE TABLE dbo.product_options (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    product_id BIGINT NOT NULL,
    option_key VARCHAR(120) NOT NULL,
    option_group_name VARCHAR(120) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_product_options_product FOREIGN KEY (product_id) REFERENCES dbo.products(id) ON DELETE CASCADE
);

CREATE TABLE dbo.product_option_values (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    product_option_id BIGINT NOT NULL,
    option_value_key VARCHAR(120) NOT NULL,
    label VARCHAR(120) NOT NULL,
    price_delta DECIMAL(10,2) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_product_option_values_option FOREIGN KEY (product_option_id) REFERENCES dbo.product_options(id) ON DELETE CASCADE
);

CREATE TABLE dbo.app_users (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    external_id VARCHAR(120) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(40) NOT NULL,
    enabled BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.user_profiles (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    location VARCHAR(255) NOT NULL,
    membership VARCHAR(255) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_user_profiles_user FOREIGN KEY (user_id) REFERENCES dbo.app_users(id) ON DELETE CASCADE
);

CREATE TABLE dbo.user_preferences (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_profile_id BIGINT NOT NULL,
    preference_text VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_user_preferences_profile FOREIGN KEY (user_profile_id) REFERENCES dbo.user_profiles(id) ON DELETE CASCADE
);

CREATE TABLE dbo.orders (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    order_number VARCHAR(40) NOT NULL UNIQUE,
    user_id BIGINT NULL,
    customer_name VARCHAR(200) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    status VARCHAR(60) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    item_count INT NOT NULL,
    fulfillment VARCHAR(255) NOT NULL,
    shipping_line1 VARCHAR(255) NOT NULL,
    shipping_city VARCHAR(120) NOT NULL,
    shipping_postal_code VARCHAR(60) NOT NULL,
    shipping_country VARCHAR(120) NOT NULL,
    payment_status VARCHAR(60) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_orders_user FOREIGN KEY (user_id) REFERENCES dbo.app_users(id)
);

CREATE TABLE dbo.order_timeline_entries (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    order_id BIGINT NOT NULL,
    timeline_text VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_order_timeline_entries_order FOREIGN KEY (order_id) REFERENCES dbo.orders(id) ON DELETE CASCADE
);

CREATE TABLE dbo.order_items (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NULL,
    product_slug VARCHAR(160) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    image_src VARCHAR(1000) NOT NULL,
    image_alt VARCHAR(255) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    selected_options_json NVARCHAR(MAX) NOT NULL,
    CONSTRAINT FK_order_items_order FOREIGN KEY (order_id) REFERENCES dbo.orders(id) ON DELETE CASCADE,
    CONSTRAINT FK_order_items_product FOREIGN KEY (product_id) REFERENCES dbo.products(id)
);

CREATE TABLE dbo.cart_items (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    selected_options_json NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_cart_items_user FOREIGN KEY (user_id) REFERENCES dbo.app_users(id) ON DELETE CASCADE,
    CONSTRAINT FK_cart_items_product FOREIGN KEY (product_id) REFERENCES dbo.products(id) ON DELETE CASCADE
);

CREATE INDEX IX_products_category_id ON dbo.products(category_id);
CREATE INDEX IX_product_tags_product_id ON dbo.product_tags(product_id);
CREATE INDEX IX_product_images_product_id ON dbo.product_images(product_id);
CREATE INDEX IX_product_specs_product_id ON dbo.product_specs(product_id);
CREATE INDEX IX_product_highlights_product_id ON dbo.product_highlights(product_id);
CREATE INDEX IX_product_options_product_id ON dbo.product_options(product_id);
CREATE INDEX IX_product_option_values_option_id ON dbo.product_option_values(product_option_id);
CREATE INDEX IX_orders_user_id ON dbo.orders(user_id);
CREATE INDEX IX_order_items_order_id ON dbo.order_items(order_id);
CREATE INDEX IX_cart_items_user_id ON dbo.cart_items(user_id);

INSERT INTO dbo.categories (slug, name, kicker, headline, description, story, hero_image_src, hero_image_alt)
VALUES
    ('keyboards', 'Keyboards', 'Exhibition / 01', 'Silent precision in machined aluminum.', 'Gallery-grade keyboard builds tuned for structure, acoustics, and tactile calm.', 'Each chassis is curated for acoustic maturity, compositional balance, and the quiet confidence of a desk object that earns its space.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVNCLpjY9c_utmK73a9IuYhnaStJwCPhy2tCy4vbZF_qMF4a_OElDEz7ZkBj0uKq-k81ethoB40zH-E1ixt48BADosISh3vC03bpj99tKC5xzUKwTjUq7TxekMVmQVvvtsELAzMOPyPOhsK2J7jnDlWDmM5kHK2Ic-r90tLTx6I-HSQjMdLcpBEOpgxCxqIAKcZMSK9HBXsF3rTaI8JAkx71sUIPZUJzIrvbt-_7YNY9lVx1L88wxNpZ7Zb25Bs3Vzel4RncAdlSI', 'Top-down view of an all-white mechanical keyboard on a minimal desk.'),
    ('accessories', 'Accessories', 'Exhibition / 02', 'Support pieces with typographic discipline.', 'Desk mats, artisan caps, and finishing touches that extend the same editorial language.', 'Accessories in Tactile are never filler. They exist to soften, ground, or sharpen the primary keyboard silhouette.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6D96WQNSExc7laAdPQf4j-q3x8Erc-IB6-rn875IPMhgu78a3-xOvUomYfCOTFhQ9sVWduMDe2X5lL8Ttz0VvNFgw-Gb6eWgoLf8Hp21vbqNTxfkVY-TtWhNtsInOagLDzg-UHVIKHWQKO6bQ1GULGYe_c-zv8SplWzvVCtg6bERuoan6KqdbZoxPBHJ7DdZ8i7Ia4X7aNk2jpoVI0ZlFybICmy-kMHDxggkDvv3mWFBXQ8XfsXBexZENjQJh7EayqzNBgT1CMmU', 'Macro photo of minimalist keycaps under soft studio lighting.'),
    ('custom-parts', 'Custom Parts', 'Exhibition / 03', 'Internal architecture, visible in feel.', 'Switches, knobs, plates, and tuned internals for builders who care about every layer.', 'The sound and sensation of a build is made long before the first keypress. These parts shape the final voice.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3inaalLfE5sedHjD-QKU1324XRS_2rzkVnuEKLrR4_aCj95CmeJcamttXrKApS7JxkqN8issdeKSJVoizU2KC1M_VyHyHVFLRYvVh8Ia4Hr8br1XxU1RWwtrgGS560fP1rf4FeZ89oND2CFWlOy_tTgNyiF7egU0RQmVTF-3PDVW1L7s1-NZyM7EbNqUFptf37rBgBFBTVCJHTFNq6gQGBW9toms1dHwS0vGWzT2tvsTKmhGDxOOBPPKMJXVXi5PrWP2hdsuTDZ8', 'Exploded diagram of a keyboard with gaskets, PCB, and plate layers.');
