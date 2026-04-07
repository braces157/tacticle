DECLARE @keyboardSeries TABLE (
    series_id INT PRIMARY KEY,
    series_name VARCHAR(80) NOT NULL,
    material VARCHAR(120) NOT NULL,
    image_src VARCHAR(1000) NOT NULL,
    price_base DECIMAL(10,2) NOT NULL
);

INSERT INTO @keyboardSeries (series_id, series_name, material, image_src, price_base)
VALUES
    (1, 'Atelier Frame', 'Bead-blasted aluminum', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVNCLpjY9c_utmK73a9IuYhnaStJwCPhy2tCy4vbZF_qMF4a_OElDEz7ZkBj0uKq-k81ethoB40zH-E1ixt48BADosISh3vC03bpj99tKC5xzUKwTjUq7TxekMVmQVvvtsELAzMOPyPOhsK2J7jnDlWDmM5kHK2Ic-r90tLTx6I-HSQjMdLcpBEOpgxCxqIAKcZMSK9HBXsF3rTaI8JAkx71sUIPZUJzIrvbt-_7YNY9lVx1L88wxNpZ7Zb25Bs3Vzel4RncAdlSI', 305.00),
    (2, 'Monograph Arc', 'Ceramic-coated aluminum', 'https://lh3.googleusercontent.com/aida-public/AB6AXuADzc-N6PUKuzJ7AXZ-i8XLTCCFOpIyGfPIr5YlwWhIJL5p4w0Y0lPtyb41grgiWEcKlHkV-k3UVDncc3_tDHF_vLix5utI710K2YXHQKwm4aqaBYFuw_s2cp-D-70wwkf86hdrRpVNegdq3IkqbpaXNwR0sc1jmQOofFc-GorAZy2ktc_d0DTuIRYS6jFT7yeq6r6UuAJEuX0ZqLAnWxkv4LAKaHBhaxOrX5MbKkSPsfU7ylNfsqcDe2g0Kbfo2rzGEMM_Hss_UxM', 320.00),
    (3, 'Stillline', 'Stone anodized aluminum', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuwbaMA4JlosypPEdAmL0pcxh43Z99x-c0NUiSYxxGh75yP5aTVEritdJdxEUKJpZU6OhN7d_gTMUkZqiMPHcaG59g3PHoqwalSf4x_b4LKsufXDljYN0ocj_TAl5YT_gRlOizQQnRXKsI7BwTrNXSfYUI5mIA4U2AC8LrdAmu7egg7xgo4fxU_jG0DoXGpxYJTL1LPce9Sa0zYWmIipGQ5548ApKQnTGuOj8fFzPUrVWDGquwHnxjXKdMWC5Atkpk9z3-18VwB6I', 335.00),
    (4, 'Northline', 'Micro-bead blasted aluminum', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVNCLpjY9c_utmK73a9IuYhnaStJwCPhy2tCy4vbZF_qMF4a_OElDEz7ZkBj0uKq-k81ethoB40zH-E1ixt48BADosISh3vC03bpj99tKC5xzUKwTjUq7TxekMVmQVvvtsELAzMOPyPOhsK2J7jnDlWDmM5kHK2Ic-r90tLTx6I-HSQjMdLcpBEOpgxCxqIAKcZMSK9HBXsF3rTaI8JAkx71sUIPZUJzIrvbt-_7YNY9lVx1L88wxNpZ7Zb25Bs3Vzel4RncAdlSI', 315.00),
    (5, 'Contour', 'Powder-coated aluminum', 'https://lh3.googleusercontent.com/aida-public/AB6AXuADzc-N6PUKuzJ7AXZ-i8XLTCCFOpIyGfPIr5YlwWhIJL5p4w0Y0lPtyb41grgiWEcKlHkV-k3UVDncc3_tDHF_vLix5utI710K2YXHQKwm4aqaBYFuw_s2cp-D-70wwkf86hdrRpVNegdq3IkqbpaXNwR0sc1jmQOofFc-GorAZy2ktc_d0DTuIRYS6jFT7yeq6r6UuAJEuX0ZqLAnWxkv4LAKaHBhaxOrX5MbKkSPsfU7ylNfsqcDe2g0Kbfo2rzGEMM_Hss_UxM', 318.00),
    (6, 'Quietform', 'Matte anodized aluminum', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuwbaMA4JlosypPEdAmL0pcxh43Z99x-c0NUiSYxxGh75yP5aTVEritdJdxEUKJpZU6OhN7d_gTMUkZqiMPHcaG59g3PHoqwalSf4x_b4LKsufXDljYN0ocj_TAl5YT_gRlOizQQnRXKsI7BwTrNXSfYUI5mIA4U2AC8LrdAmu7egg7xgo4fxU_jG0DoXGpxYJTL1LPce9Sa0zYWmIipGQ5548ApKQnTGuOj8fFzPUrVWDGquwHnxjXKdMWC5Atkpk9z3-18VwB6I', 300.00);

DECLARE @keyboardLayouts TABLE (
    layout_id INT PRIMARY KEY,
    layout_code VARCHAR(20) NOT NULL,
    subtitle VARCHAR(400) NOT NULL,
    price_delta DECIMAL(10,2) NOT NULL
);

INSERT INTO @keyboardLayouts (layout_id, layout_code, subtitle, price_delta)
VALUES
    (1, '60', 'Compact geometry tuned for a calm, clipped typing note.', 0.00),
    (2, '65', 'A fuller compact layout with softened acoustics and longer sight lines.', 24.00),
    (3, '75', 'More function keys with the same quiet editorial posture.', 42.00);

INSERT INTO dbo.products (
    slug,
    category_id,
    name,
    subtitle,
    description,
    story,
    material,
    price,
    image_src,
    image_alt,
    sku,
    stock,
    visibility,
    archived,
    featured
)
SELECT
    LOWER(REPLACE(CONCAT(series.series_name, '-', layout.layout_code), ' ', '-')),
    (SELECT id FROM dbo.categories WHERE slug = 'keyboards'),
    CONCAT(series.series_name, ' ', layout.layout_code),
    layout.subtitle,
    CONCAT('A ', layout.layout_code, '% layout shaped for quieter work, steadier tone, and a more intentional desk presence.'),
    series.series_name + ' expands the gallery with a compact form that still feels substantial, composed, and built for long sessions.',
    series.material,
    series.price_base + layout.price_delta,
    series.image_src,
    CONCAT(series.series_name, ' ', layout.layout_code, ' keyboard product image.'),
    CONCAT('KB-EXP-', RIGHT('000' + CAST(100 + ((series.series_id - 1) * 3) + layout.layout_id AS VARCHAR(3)), 3)),
    8 + series.series_id + layout.layout_id,
    'Active',
    0,
    CASE WHEN series.series_id = 1 AND layout.layout_id <= 3 THEN 1 ELSE 0 END
FROM @keyboardSeries series
CROSS JOIN @keyboardLayouts layout;

DECLARE @accessorySeries TABLE (
    series_id INT PRIMARY KEY,
    series_name VARCHAR(80) NOT NULL
);

INSERT INTO @accessorySeries (series_id, series_name)
VALUES
    (1, 'Quiet Grid II'),
    (2, 'Studio Loom'),
    (3, 'Gallery White'),
    (4, 'Ashen Script');

DECLARE @accessoryTypes TABLE (
    type_id INT PRIMARY KEY,
    type_name VARCHAR(80) NOT NULL,
    type_slug VARCHAR(80) NOT NULL,
    material VARCHAR(120) NOT NULL,
    image_src VARCHAR(1000) NOT NULL,
    price_base DECIMAL(10,2) NOT NULL
);

INSERT INTO @accessoryTypes (type_id, type_name, type_slug, material, image_src, price_base)
VALUES
    (1, 'Keycap Set', 'keycap-set', 'Dye-sub PBT', 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6D96WQNSExc7laAdPQf4j-q3x8Erc-IB6-rn875IPMhgu78a3-xOvUomYfCOTFhQ9sVWduMDe2X5lL8Ttz0VvNFgw-Gb6eWgoLf8Hp21vbqNTxfkVY-TtWhNtsInOagLDzg-UHVIKHWQKO6bQ1GULGYe_c-zv8SplWzvVCtg6bERuoan6KqdbZoxPBHJ7DdZ8i7Ia4X7aNk2jpoVI0ZlFybICmy-kMHDxggkDvv3mWFBXQ8XfsXBexZENjQJh7EayqzNBgT1CMmU', 96.00),
    (2, 'Desk Mat', 'desk-mat', 'Wool blend felt', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzLHT59nxB33Z9pDwHPlvCTQqCr4WixIAjgCatmbHFIxChR2fWv__bBZ3TIVzxE32yeuf90LKFNE4D30Cih2ZV4vZgEJ7kyr9wucmJ9kg8Gun4HXFER2FZj8BAkA44sc7a7oi3uRkrOHf3IKgCRB3T3u-nHyqsLVWdhUPljoHTzA_vlVseE79DK68kXBnuGsu2jwp5Rp9T762HI3o5jSwuBr_bHvPnO1TZiDgQrDkR0J8vgcpeyn-JDeDiHJ1F-x-WNF18WKkNBXo', 70.00),
    (3, 'Coiled Cable', 'coiled-cable', 'Paracord sleeving', 'https://lh3.googleusercontent.com/aida-public/AB6AXuADzc-N6PUKuzJ7AXZ-i8XLTCCFOpIyGfPIr5YlwWhIJL5p4w0Y0lPtyb41grgiWEcKlHkV-k3UVDncc3_tDHF_vLix5utI710K2YXHQKwm4aqaBYFuw_s2cp-D-70wwkf86hdrRpVNegdq3IkqbpaXNwR0sc1jmQOofFc-GorAZy2ktc_d0DTuIRYS6jFT7yeq6r6UuAJEuX0ZqLAnWxkv4LAKaHBhaxOrX5MbKkSPsfU7ylNfsqcDe2g0Kbfo2rzGEMM_Hss_UxM', 48.00),
    (4, 'Wrist Rest', 'wrist-rest', 'Oak and resin', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzLHT59nxB33Z9pDwHPlvCTQqCr4WixIAjgCatmbHFIxChR2fWv__bBZ3TIVzxE32yeuf90LKFNE4D30Cih2ZV4vZgEJ7kyr9wucmJ9kg8Gun4HXFER2FZj8BAkA44sc7a7oi3uRkrOHf3IKgCRB3T3u-nHyqsLVWdhUPljoHTzA_vlVseE79DK68kXBnuGsu2jwp5Rp9T762HI3o5jSwuBr_bHvPnO1TZiDgQrDkR0J8vgcpeyn-JDeDiHJ1F-x-WNF18WKkNBXo', 62.00);

INSERT INTO dbo.products (
    slug,
    category_id,
    name,
    subtitle,
    description,
    story,
    material,
    price,
    image_src,
    image_alt,
    sku,
    stock,
    visibility,
    archived,
    featured
)
SELECT
    LOWER(REPLACE(CONCAT(series.series_name, '-', item.type_slug), ' ', '-')),
    (SELECT id FROM dbo.categories WHERE slug = 'accessories'),
    CONCAT(series.series_name, ' ', item.type_name),
    CONCAT('A restrained ', LOWER(item.type_name), ' shaped for cleaner, calmer desk compositions.'),
    CONCAT(series.series_name, ' ', item.type_name, ' extends the gallery with softer contrast, quieter material choices, and more editorial desk utility.'),
    'These accessories are meant to support the keyboard without competing with it, keeping the whole setup coherent and low-stress.',
    item.material,
    item.price_base + (series.series_id * 2),
    item.image_src,
    CONCAT(series.series_name, ' ', item.type_name, ' product image.'),
    CONCAT('AC-EXP-', RIGHT('000' + CAST(200 + ((series.series_id - 1) * 4) + item.type_id AS VARCHAR(3)), 3)),
    10 + series.series_id + item.type_id,
    'Active',
    0,
    CASE WHEN series.series_id = 1 AND item.type_id IN (1, 2) THEN 1 ELSE 0 END
FROM @accessorySeries series
CROSS JOIN @accessoryTypes item;

DECLARE @partSeries TABLE (
    series_id INT PRIMARY KEY,
    series_name VARCHAR(80) NOT NULL
);

INSERT INTO @partSeries (series_id, series_name)
VALUES
    (1, 'Obsidian V2'),
    (2, 'Brassline'),
    (3, 'Signal'),
    (4, 'Stoneform');

DECLARE @partTypes TABLE (
    type_id INT PRIMARY KEY,
    type_name VARCHAR(80) NOT NULL,
    type_slug VARCHAR(80) NOT NULL,
    material VARCHAR(120) NOT NULL,
    image_src VARCHAR(1000) NOT NULL,
    price_base DECIMAL(10,2) NOT NULL
);

INSERT INTO @partTypes (type_id, type_name, type_slug, material, image_src, price_base)
VALUES
    (1, 'Switch Pack', 'switch-pack', 'Nylon / POM', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQxiVTz86ehaz_BMK6njc7mThLkBnPxB75mroO_h_z1xZIWABgNzFOY7zrXWku6Mrlc5eXTt_CJYFKTPuau6dKd1QLFIcP-ov90oo2ws3KokX_ppCx3ivU8HZzHl6sNiM5-8_5sP18v_R_HUZ3h4FN_9s4yke53I51RNxowmatzwirmG_lpRUkWSV3xWrayns2DvTineikWyHLMCid9KXHKoqqDpOAdApT8IsNFCk-hxZkBD3SSOSBv58HFYpTZksreeWIHCVubks', 58.00),
    (2, 'Plate Kit', 'plate-kit', 'Machined brass', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3inaalLfE5sedHjD-QKU1324XRS_2rzkVnuEKLrR4_aCj95CmeJcamttXrKApS7JxkqN8issdeKSJVoizU2KC1M_VyHyHVFLRYvVh8Ia4Hr8br1XxU1RWwtrgGS560fP1rf4FeZ89oND2CFWlOy_tTgNyiF7egU0RQmVTF-3PDVW1L7s1-NZyM7EbNqUFptf37rBgBFBTVCJHTFNq6gQGBW9toms1dHwS0vGWzT2tvsTKmhGDxOOBPPKMJXVXi5PrWP2hdsuTDZ8', 78.00),
    (3, 'Encoder Knob', 'encoder-knob', 'Machined aluminum', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuwbaMA4JlosypPEdAmL0pcxh43Z99x-c0NUiSYxxGh75yP5aTVEritdJdxEUKJpZU6OhN7d_gTMUkZqiMPHcaG59g3PHoqwalSf4x_b4LKsufXDljYN0ocj_TAl5YT_gRlOizQQnRXKsI7BwTrNXSfYUI5mIA4U2AC8LrdAmu7egg7xgo4fxU_jG0DoXGpxYJTL1LPce9Sa0zYWmIipGQ5548ApKQnTGuOj8fFzPUrVWDGquwHnxjXKdMWC5Atkpk9z3-18VwB6I', 34.00),
    (4, 'Foam Kit', 'foam-kit', 'Poron / IXPE', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3inaalLfE5sedHjD-QKU1324XRS_2rzkVnuEKLrR4_aCj95CmeJcamttXrKApS7JxkqN8issdeKSJVoizU2KC1M_VyHyHVFLRYvVh8Ia4Hr8br1XxU1RWwtrgGS560fP1rf4FeZ89oND2CFWlOy_tTgNyiF7egU0RQmVTF-3PDVW1L7s1-NZyM7EbNqUFptf37rBgBFBTVCJHTFNq6gQGBW9toms1dHwS0vGWzT2tvsTKmhGDxOOBPPKMJXVXi5PrWP2hdsuTDZ8', 27.00);

INSERT INTO dbo.products (
    slug,
    category_id,
    name,
    subtitle,
    description,
    story,
    material,
    price,
    image_src,
    image_alt,
    sku,
    stock,
    visibility,
    archived,
    featured
)
SELECT
    LOWER(REPLACE(CONCAT(series.series_name, '-', item.type_slug), ' ', '-')),
    (SELECT id FROM dbo.categories WHERE slug = 'custom-parts'),
    CONCAT(series.series_name, ' ', item.type_name),
    CONCAT('A builder-focused ', LOWER(item.type_name), ' for calmer internals, cleaner feel, and more deliberate tuning.'),
    CONCAT(series.series_name, ' ', item.type_name, ' is meant for iterative builders who care about every layer, every contact point, and every tonal shift.'),
    'These components change more than spec sheets: they alter the whole emotional read of the finished board.',
    item.material,
    item.price_base + (series.series_id * 3),
    item.image_src,
    CONCAT(series.series_name, ' ', item.type_name, ' product image.'),
    CONCAT('CP-EXP-', RIGHT('000' + CAST(300 + ((series.series_id - 1) * 4) + item.type_id AS VARCHAR(3)), 3)),
    9 + series.series_id + item.type_id,
    'Active',
    0,
    CASE WHEN series.series_id = 1 AND item.type_id = 1 THEN 1 ELSE 0 END
FROM @partSeries series
CROSS JOIN @partTypes item;

INSERT INTO dbo.product_tags (product_id, tag)
SELECT p.id, tags.tag
FROM dbo.products p
JOIN dbo.categories c ON c.id = p.category_id
CROSS APPLY (
    VALUES
        ('Expanded Catalog'),
        (CASE
            WHEN c.slug = 'keyboards' THEN 'Studio Edition'
            WHEN c.slug = 'accessories' THEN 'Desk Setup'
            ELSE 'Builder Essential'
        END),
        (CASE
            WHEN c.slug = 'keyboards' AND p.name LIKE '% 60' THEN '60%'
            WHEN c.slug = 'keyboards' AND p.name LIKE '% 65' THEN '65%'
            WHEN c.slug = 'keyboards' AND p.name LIKE '% 75' THEN '75%'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Keycap Set%' THEN 'Keycaps'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Desk Mat%' THEN 'Desk Mat'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Coiled Cable%' THEN 'Cable'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Wrist Rest%' THEN 'Wrist Rest'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Switch Pack%' THEN 'Switches'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Plate Kit%' THEN 'Plate'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Encoder Knob%' THEN 'Knob'
            ELSE 'Foam'
        END)
) tags(tag)
WHERE p.sku LIKE '%-EXP-%';

INSERT INTO dbo.product_images (product_id, image_src, image_alt, sort_order)
SELECT p.id, images.image_src, images.image_alt, images.sort_order
FROM dbo.products p
JOIN dbo.categories c ON c.id = p.category_id
CROSS APPLY (
    VALUES
        (p.image_src, p.image_alt, 1),
        (CASE
            WHEN c.slug = 'keyboards' THEN 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzLHT59nxB33Z9pDwHPlvCTQqCr4WixIAjgCatmbHFIxChR2fWv__bBZ3TIVzxE32yeuf90LKFNE4D30Cih2ZV4vZgEJ7kyr9wucmJ9kg8Gun4HXFER2FZj8BAkA44sc7a7oi3uRkrOHf3IKgCRB3T3u-nHyqsLVWdhUPljoHTzA_vlVseE79DK68kXBnuGsu2jwp5Rp9T762HI3o5jSwuBr_bHvPnO1TZiDgQrDkR0J8vgcpeyn-JDeDiHJ1F-x-WNF18WKkNBXo'
            WHEN c.slug = 'accessories' THEN 'https://lh3.googleusercontent.com/aida-public/AB6AXuADzc-N6PUKuzJ7AXZ-i8XLTCCFOpIyGfPIr5YlwWhIJL5p4w0Y0lPtyb41grgiWEcKlHkV-k3UVDncc3_tDHF_vLix5utI710K2YXHQKwm4aqaBYFuw_s2cp-D-70wwkf86hdrRpVNegdq3IkqbpaXNwR0sc1jmQOofFc-GorAZy2ktc_d0DTuIRYS6jFT7yeq6r6UuAJEuX0ZqLAnWxkv4LAKaHBhaxOrX5MbKkSPsfU7ylNfsqcDe2g0Kbfo2rzGEMM_Hss_UxM'
            ELSE 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuwbaMA4JlosypPEdAmL0pcxh43Z99x-c0NUiSYxxGh75yP5aTVEritdJdxEUKJpZU6OhN7d_gTMUkZqiMPHcaG59g3PHoqwalSf4x_b4LKsufXDljYN0ocj_TAl5YT_gRlOizQQnRXKsI7BwTrNXSfYUI5mIA4U2AC8LrdAmu7egg7xgo4fxU_jG0DoXGpxYJTL1LPce9Sa0zYWmIipGQ5548ApKQnTGuOj8fFzPUrVWDGquwHnxjXKdMWC5Atkpk9z3-18VwB6I'
        END,
        CASE
            WHEN c.slug = 'keyboards' THEN p.name + ' detail view on a minimalist workspace.'
            WHEN c.slug = 'accessories' THEN p.name + ' detail view in a desk composition.'
            ELSE p.name + ' detail view beside build components.'
        END, 2),
        (CASE
            WHEN c.slug = 'keyboards' THEN 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3inaalLfE5sedHjD-QKU1324XRS_2rzkVnuEKLrR4_aCj95CmeJcamttXrKApS7JxkqN8issdeKSJVoizU2KC1M_VyHyHVFLRYvVh8Ia4Hr8br1XxU1RWwtrgGS560fP1rf4FeZ89oND2CFWlOy_tTgNyiF7egU0RQmVTF-3PDVW1L7s1-NZyM7EbNqUFptf37rBgBFBTVCJHTFNq6gQGBW9toms1dHwS0vGWzT2tvsTKmhGDxOOBPPKMJXVXi5PrWP2hdsuTDZ8'
            WHEN c.slug = 'accessories' THEN 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVNCLpjY9c_utmK73a9IuYhnaStJwCPhy2tCy4vbZF_qMF4a_OElDEz7ZkBj0uKq-k81ethoB40zH-E1ixt48BADosISh3vC03bpj99tKC5xzUKwTjUq7TxekMVmQVvvtsELAzMOPyPOhsK2J7jnDlWDmM5kHK2Ic-r90tLTx6I-HSQjMdLcpBEOpgxCxqIAKcZMSK9HBXsF3rTaI8JAkx71sUIPZUJzIrvbt-_7YNY9lVx1L88wxNpZ7Zb25Bs3Vzel4RncAdlSI'
            ELSE 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQxiVTz86ehaz_BMK6njc7mThLkBnPxB75mroO_h_z1xZIWABgNzFOY7zrXWku6Mrlc5eXTt_CJYFKTPuau6dKd1QLFIcP-ov90oo2ws3KokX_ppCx3ivU8HZzHl6sNiM5-8_5sP18v_R_HUZ3h4FN_9s4yke53I51RNxowmatzwirmG_lpRUkWSV3xWrayns2DvTineikWyHLMCid9KXHKoqqDpOAdApT8IsNFCk-hxZkBD3SSOSBv58HFYpTZksreeWIHCVubks'
        END,
        CASE
            WHEN c.slug = 'keyboards' THEN p.name + ' exploded or technical detail view.'
            WHEN c.slug = 'accessories' THEN p.name + ' styled in a quiet editorial setup.'
            ELSE p.name + ' presented with hardware and assembly context.'
        END, 3)
) images(image_src, image_alt, sort_order)
WHERE p.sku LIKE '%-EXP-%';

INSERT INTO dbo.product_specs (product_id, spec_label, spec_value, sort_order)
SELECT p.id, specs.spec_label, specs.spec_value, specs.sort_order
FROM dbo.products p
JOIN dbo.categories c ON c.id = p.category_id
CROSS APPLY (
    VALUES
        (CASE
            WHEN c.slug = 'keyboards' THEN 'Layout'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Keycap Set%' THEN 'Material'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Desk Mat%' THEN 'Size'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Coiled Cable%' THEN 'Connector'
            WHEN c.slug = 'accessories' THEN 'Material'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Switch Pack%' THEN 'Count'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Plate Kit%' THEN 'Material'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Encoder Knob%' THEN 'Diameter'
            ELSE 'Layers'
        END,
        CASE
            WHEN c.slug = 'keyboards' AND p.name LIKE '% 60' THEN '60% ANSI'
            WHEN c.slug = 'keyboards' AND p.name LIKE '% 65' THEN '65% ANSI'
            WHEN c.slug = 'keyboards' THEN '75% compact'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Keycap Set%' THEN '1.5mm PBT'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Desk Mat%' THEN '900 x 400mm'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Coiled Cable%' THEN 'USB-C to USB-A'
            WHEN c.slug = 'accessories' THEN 'Oak / resin composite'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Switch Pack%' THEN '90 switches'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Plate Kit%' THEN 'Brass or aluminum'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Encoder Knob%' THEN '20mm'
            ELSE 'Case, plate, switch'
        END, 1),
        (CASE
            WHEN c.slug = 'keyboards' THEN 'Connectivity'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Keycap Set%' THEN 'Profile'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Desk Mat%' THEN 'Backing'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Coiled Cable%' THEN 'Cable length'
            WHEN c.slug = 'accessories' THEN 'Height'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Switch Pack%' THEN 'Spring'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Plate Kit%' THEN 'Thickness'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Encoder Knob%' THEN 'Finish'
            ELSE 'Material'
        END,
        CASE
            WHEN c.slug = 'keyboards' THEN 'USB-C / wireless'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Keycap Set%' THEN 'Cherry'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Desk Mat%' THEN 'Natural rubber'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Coiled Cable%' THEN '1.8m total'
            WHEN c.slug = 'accessories' THEN 'Low front profile'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Switch Pack%' THEN '55g dual-stage'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Plate Kit%' THEN '1.5mm'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Encoder Knob%' THEN 'Matte bead blast'
            ELSE 'Poron / IXPE'
        END, 2),
        (CASE
            WHEN c.slug = 'keyboards' THEN 'Firmware'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Keycap Set%' THEN 'Compatibility'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Desk Mat%' THEN 'Thickness'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Coiled Cable%' THEN 'Detachable aviator'
            WHEN c.slug = 'accessories' THEN 'Layout support'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Switch Pack%' THEN 'Prep'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Plate Kit%' THEN 'Layout support'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Encoder Knob%' THEN 'Set screw'
            ELSE 'Acoustic goal'
        END,
        CASE
            WHEN c.slug = 'keyboards' THEN 'QMK / VIA'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Keycap Set%' THEN '60 / 65 / 75 / TKL'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Desk Mat%' THEN '4mm'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Coiled Cable%' THEN 'Yes'
            WHEN c.slug = 'accessories' THEN 'Compact to TKL'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Switch Pack%' THEN 'Factory-lubed rails'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Plate Kit%' THEN '60 / 65 / 75'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Encoder Knob%' THEN 'Included'
            ELSE 'Lower resonance / quieter decay'
        END, 3)
) specs(spec_label, spec_value, sort_order)
WHERE p.sku LIKE '%-EXP-%';

INSERT INTO dbo.product_highlights (product_id, highlight_text, sort_order)
SELECT p.id, highlights.highlight_text, highlights.sort_order
FROM dbo.products p
JOIN dbo.categories c ON c.id = p.category_id
CROSS APPLY (
    VALUES
        (CASE
            WHEN c.slug = 'keyboards' THEN 'Expanded gallery release'
            WHEN c.slug = 'accessories' THEN 'Quiet desk companion'
            ELSE 'Builder-focused tuning part'
        END, 1),
        (CASE
            WHEN c.slug = 'keyboards' THEN 'Composed acoustic profile'
            WHEN c.slug = 'accessories' THEN 'Editorial material palette'
            ELSE 'Small change, major feel shift'
        END, 2),
        (CASE
            WHEN c.slug = 'keyboards' THEN 'Calm visual mass'
            WHEN c.slug = 'accessories' THEN 'Low visual friction'
            ELSE 'Made for iterative builds'
        END, 3)
) highlights(highlight_text, sort_order)
WHERE p.sku LIKE '%-EXP-%';

INSERT INTO dbo.product_options (product_id, option_key, option_group_name, sort_order)
SELECT p.id, options.option_key, options.option_group_name, options.sort_order
FROM dbo.products p
JOIN dbo.categories c ON c.id = p.category_id
CROSS APPLY (
    VALUES
        (CASE
            WHEN c.slug = 'keyboards' THEN 'switches'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Keycap Set%' THEN 'legend'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Desk Mat%' THEN 'color'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Coiled Cable%' THEN 'connector'
            WHEN c.slug = 'accessories' THEN 'size'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Switch Pack%' THEN 'pack'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Plate Kit%' THEN 'layout'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Encoder Knob%' THEN 'finish'
            ELSE 'layout'
        END,
        CASE
            WHEN c.slug = 'keyboards' THEN 'Switch Variant'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Keycap Set%' THEN 'Legend Style'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Desk Mat%' THEN 'Colorway'
            WHEN c.slug = 'accessories' AND p.name LIKE '%Coiled Cable%' THEN 'Connector'
            WHEN c.slug = 'accessories' THEN 'Size'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Switch Pack%' THEN 'Pack Size'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Plate Kit%' THEN 'Layout'
            WHEN c.slug = 'custom-parts' AND p.name LIKE '%Encoder Knob%' THEN 'Finish'
            ELSE 'Layout'
        END, 1),
        (CASE WHEN c.slug = 'keyboards' THEN 'plate' ELSE NULL END,
         CASE WHEN c.slug = 'keyboards' THEN 'Plate Material' ELSE NULL END, 2)
) options(option_key, option_group_name, sort_order)
WHERE p.sku LIKE '%-EXP-%'
  AND options.option_key IS NOT NULL;

INSERT INTO dbo.product_option_values (product_option_id, option_value_key, label, price_delta, sort_order)
SELECT po.id, valueset.option_value_key, valueset.label, valueset.price_delta, valueset.sort_order
FROM dbo.product_options po
JOIN dbo.products p ON p.id = po.product_id
CROSS APPLY (
    VALUES
        ('switches', 'linen-linear', 'Linen Linear', 0.00, 1),
        ('switches', 'obsidian-tactile', 'Obsidian Tactile', 12.00, 2),
        ('plate', 'fr4', 'FR4', 0.00, 1),
        ('plate', 'polycarbonate', 'Polycarbonate', 18.00, 2),
        ('legend', 'standard', 'Standard', 0.00, 1),
        ('legend', 'blank', 'Blank alphas', 10.00, 2),
        ('color', 'ash', 'Ash', 0.00, 1),
        ('color', 'stone', 'Stone', 0.00, 2),
        ('connector', 'usb-c-a', 'USB-C to USB-A', 0.00, 1),
        ('connector', 'usb-c-c', 'USB-C to USB-C', 8.00, 2),
        ('size', 'compact', 'Compact', 0.00, 1),
        ('size', 'wide', 'Wide', 12.00, 2),
        ('pack', '90', '90 switches', 0.00, 1),
        ('pack', '110', '110 switches', 14.00, 2),
        ('layout', '60-65', '60% / 65%', 0.00, 1),
        ('layout', '75-tkl', '75% / TKL', 8.00, 2),
        ('finish', 'matte', 'Matte', 0.00, 1),
        ('finish', 'polished', 'Polished', 10.00, 2)
) valueset(option_key, option_value_key, label, price_delta, sort_order)
WHERE p.sku LIKE '%-EXP-%'
  AND valueset.option_key = po.option_key;
