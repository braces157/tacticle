INSERT INTO dbo.app_users (external_id, name, email, password_hash, role, enabled)
VALUES
    ('user-atelier', 'Atelier Member', 'member@tactile.gallery', 'quiet', 'customer', 1),
    ('admin-tactile', 'Admin User', 'admin@tactile.gallery', 'quiet', 'admin', 1);

INSERT INTO dbo.user_profiles (user_id, location, membership)
SELECT id, 'Bangkok, Thailand', 'Gallery Member since 2024'
FROM dbo.app_users
WHERE external_id = 'user-atelier';

INSERT INTO dbo.user_preferences (user_profile_id, preference_text, sort_order)
SELECT up.id, pref.preference_text, pref.sort_order
FROM dbo.user_profiles up
CROSS APPLY (VALUES
    ('Quiet tactility', 1),
    ('Stone-toned finishes', 2),
    ('65% layouts', 3)
) pref(preference_text, sort_order)
JOIN dbo.app_users au ON au.id = up.user_id
WHERE au.external_id = 'user-atelier';

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
VALUES
    (
        'tactile-core-65',
        (SELECT id FROM dbo.categories WHERE slug = 'keyboards'),
        'Tactile Core-65',
        'A quiet 65% frame balanced for marbly, low-register acoustics.',
        'A softly weighted 65% layout with gasket isolation, tuned poron, and a surface finish that reads like stoneware under daylight.',
        'The Core-65 exists for people who want restraint rather than spectacle. Every visible edge is softened by spacing and every internal layer is tuned for acoustic clarity.',
        'CNC aluminum',
        420.00,
        'https://lh3.googleusercontent.com/aida-public/AB6AXuADzc-N6PUKuzJ7AXZ-i8XLTCCFOpIyGfPIr5YlwWhIJL5p4w0Y0lPtyb41grgiWEcKlHkV-k3UVDncc3_tDHF_vLix5utI710K2YXHQKwm4aqaBYFuw_s2cp-D-70wwkf86hdrRpVNegdq3IkqbpaXNwR0sc1jmQOofFc-GorAZy2ktc_d0DTuIRYS6jFT7yeq6r6UuAJEuX0ZqLAnWxkv4LAKaHBhaxOrX5MbKkSPsfU7ylNfsqcDe2g0Kbfo2rzGEMM_Hss_UxM',
        'Minimal mechanical keyboard with matte gray keycaps on white stone.',
        'KB-TC-065',
        12,
        'Active',
        0,
        1
    ),
    (
        'monolith-pro-tkl',
        (SELECT id FROM dbo.categories WHERE slug = 'keyboards'),
        'Monolith Pro TKL',
        'A tenkeyless chassis with denser mass and a flatter studio posture.',
        'A commanding TKL platform with a muted profile, expanded desk presence, and sharper acoustic separation for writers who prefer a firmer bottom-out.',
        'The Monolith line is built around optical centering: nothing is mathematically centered, but every proportion feels composed.',
        'Silver aluminum',
        520.00,
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBuwbaMA4JlosypPEdAmL0pcxh43Z99x-c0NUiSYxxGh75yP5aTVEritdJdxEUKJpZU6OhN7d_gTMUkZqiMPHcaG59g3PHoqwalSf4x_b4LKsufXDljYN0ocj_TAl5YT_gRlOizQQnRXKsI7BwTrNXSfYUI5mIA4U2AC8LrdAmu7egg7xgo4fxU_jG0DoXGpxYJTL1LPce9Sa0zYWmIipGQ5548ApKQnTGuOj8fFzPUrVWDGquwHnxjXKdMWC5Atkpk9z3-18VwB6I',
        'High-end custom keyboard chassis made of frosted acrylic and silver aluminum.',
        'KB-MP-TKL',
        4,
        'Active',
        0,
        0
    ),
    (
        'atlas-60',
        (SELECT id FROM dbo.categories WHERE slug = 'keyboards'),
        'Atlas-60',
        'Compact minimalism with a brighter, springier acoustic profile.',
        'Atlas-60 distills the Tactile language into a compact footprint that still feels architectural and grown-up.',
        'Where the Core-65 is soft and grounded, Atlas-60 is brisk and composed, intended for mobile desks and tighter work zones.',
        'Ceramic-coated aluminum',
        365.00,
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDVNCLpjY9c_utmK73a9IuYhnaStJwCPhy2tCy4vbZF_qMF4a_OElDEz7ZkBj0uKq-k81ethoB40zH-E1ixt48BADosISh3vC03bpj99tKC5xzUKwTjUq7TxekMVmQVvvtsELAzMOPyPOhsK2J7jnDlWDmM5kHK2Ic-r90tLTx6I-HSQjMdLcpBEOpgxCxqIAKcZMSK9HBXsF3rTaI8JAkx71sUIPZUJzIrvbt-_7YNY9lVx1L88wxNpZ7Zb25Bs3Vzel4RncAdlSI',
        'Compact 60% keyboard in soft natural lighting.',
        'KB-AT-060',
        0,
        'Hidden',
        0,
        0
    ),
    (
        'quiet-grid-keycap-set',
        (SELECT id FROM dbo.categories WHERE slug = 'accessories'),
        'Quiet Grid Keycap Set',
        'Low-contrast legends and crisp typography across every row.',
        'A dense PBT set with softened legends and a creamy off-white tone that pairs with cold metals and light woods.',
        'The legend design intentionally pulls back to let the keyboard silhouette lead.',
        'Dye-sub PBT',
        95.00,
        'https://lh3.googleusercontent.com/aida-public/AB6AXuD6D96WQNSExc7laAdPQf4j-q3x8Erc-IB6-rn875IPMhgu78a3-xOvUomYfCOTFhQ9sVWduMDe2X5lL8Ttz0VvNFgw-Gb6eWgoLf8Hp21vbqNTxfkVY-TtWhNtsInOagLDzg-UHVIKHWQKO6bQ1GULGYe_c-zv8SplWzvVCtg6bERuoan6KqdbZoxPBHJ7DdZ8i7Ia4X7aNk2jpoVI0ZlFybICmy-kMHDxggkDvv3mWFBXQ8XfsXBexZENjQJh7EayqzNBgT1CMmU',
        'Minimal white keycaps with subtle legends.',
        'AC-QG-CAP',
        18,
        'Active',
        0,
        1
    ),
    (
        'atelier-desk-mat',
        (SELECT id FROM dbo.categories WHERE slug = 'accessories'),
        'Atelier Desk Mat',
        'A tonal desk surface that quiets resonance and frames the board.',
        'A weighty felt mat that absorbs harsh frequencies and provides a calm visual plane for lighter keyboard finishes.',
        'The desk mat is treated as an environmental layer, not an accessory add-on.',
        'Wool blend felt',
        68.00,
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDzLHT59nxB33Z9pDwHPlvCTQqCr4WixIAjgCatmbHFIxChR2fWv__bBZ3TIVzxE32yeuf90LKFNE4D30Cih2ZV4vZgEJ7kyr9wucmJ9kg8Gun4HXFER2FZj8BAkA44sc7a7oi3uRkrOHf3IKgCRB3T3u-nHyqsLVWdhUPljoHTzA_vlVseE79DK68kXBnuGsu2jwp5Rp9T762HI3o5jSwuBr_bHvPnO1TZiDgQrDkR0J8vgcpeyn-JDeDiHJ1F-x-WNF18WKkNBXo',
        'Desk mat on a designer''s workspace.',
        'AC-AT-MAT',
        25,
        'Active',
        0,
        0
    ),
    (
        'obsidian-tactile-switch-pack',
        (SELECT id FROM dbo.categories WHERE slug = 'custom-parts'),
        'Obsidian Tactile Switch Pack',
        'A rounded tactile bump with a darker, denser after-sound.',
        'Designed for builders who want tactility without scratch. Obsidian leans toward a quiet, rounded note rather than a sharp click.',
        'Switch choice is one of the final determinants of character, so this pack is tuned to preserve composure even at speed.',
        'Nylon / POM',
        58.00,
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDQxiVTz86ehaz_BMK6njc7mThLkBnPxB75mroO_h_z1xZIWABgNzFOY7zrXWku6Mrlc5eXTt_CJYFKTPuau6dKd1QLFIcP-ov90oo2ws3KokX_ppCx3ivU8HZzHl6sNiM5-8_5sP18v_R_HUZ3h4FN_9s4yke53I51RNxowmatzwirmG_lpRUkWSV3xWrayns2DvTineikWyHLMCid9KXHKoqqDpOAdApT8IsNFCk-hxZkBD3SSOSBv58HFYpTZksreeWIHCVubks',
        'Mechanical keyboard switches arranged in a grid.',
        'CP-OB-090',
        3,
        'Active',
        0,
        1
    ),
    (
        'brass-accent-plate',
        (SELECT id FROM dbo.categories WHERE slug = 'custom-parts'),
        'Brass Accent Plate',
        'A denser plate that adds shimmer, mass, and visual warmth.',
        'A plate for builders seeking more mass, cleaner resonance, and a warmer metallic undertone in the typing feel.',
        'It is a technical part, but it also changes the emotional read of the whole board.',
        'Machined brass',
        75.00,
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC3inaalLfE5sedHjD-QKU1324XRS_2rzkVnuEKLrR4_aCj95CmeJcamttXrKApS7JxkqN8issdeKSJVoizU2KC1M_VyHyHVFLRYvVh8Ia4Hr8br1XxU1RWwtrgGS560fP1rf4FeZ89oND2CFWlOy_tTgNyiF7egU0RQmVTF-3PDVW1L7s1-NZyM7EbNqUFptf37rBgBFBTVCJHTFNq6gQGBW9toms1dHwS0vGWzT2tvsTKmhGDxOOBPPKMJXVXi5PrWP2hdsuTDZ8',
        'Keyboard internal plate in exploded layout.',
        'CP-BR-PLT',
        8,
        'Active',
        0,
        0
    );

INSERT INTO dbo.product_tags (product_id, tag)
SELECT p.id, t.tag
FROM dbo.products p
JOIN (VALUES
    ('tactile-core-65', 'Wireless'),
    ('tactile-core-65', 'Gallery Favorite'),
    ('tactile-core-65', '65%'),
    ('monolith-pro-tkl', 'TKL'),
    ('monolith-pro-tkl', 'Studio'),
    ('monolith-pro-tkl', 'Premium'),
    ('atlas-60', '60%'),
    ('atlas-60', 'Portable'),
    ('atlas-60', 'Minimal'),
    ('quiet-grid-keycap-set', 'PBT'),
    ('quiet-grid-keycap-set', 'Cherry profile'),
    ('quiet-grid-keycap-set', 'Typographic'),
    ('atelier-desk-mat', 'Felt'),
    ('atelier-desk-mat', 'Desk setup'),
    ('atelier-desk-mat', 'Acoustic'),
    ('obsidian-tactile-switch-pack', 'Switches'),
    ('obsidian-tactile-switch-pack', 'Tactile'),
    ('obsidian-tactile-switch-pack', 'Hand-lubed'),
    ('brass-accent-plate', 'Plate'),
    ('brass-accent-plate', 'Brass'),
    ('brass-accent-plate', 'Weight')
) t(slug, tag) ON t.slug = p.slug;

INSERT INTO dbo.product_images (product_id, image_src, image_alt, sort_order)
SELECT p.id, i.image_src, i.image_alt, i.sort_order
FROM dbo.products p
JOIN (VALUES
    ('tactile-core-65', 'https://lh3.googleusercontent.com/aida-public/AB6AXuADzc-N6PUKuzJ7AXZ-i8XLTCCFOpIyGfPIr5YlwWhIJL5p4w0Y0lPtyb41grgiWEcKlHkV-k3UVDncc3_tDHF_vLix5utI710K2YXHQKwm4aqaBYFuw_s2cp-D-70wwkf86hdrRpVNegdq3IkqbpaXNwR0sc1jmQOofFc-GorAZy2ktc_d0DTuIRYS6jFT7yeq6r6UuAJEuX0ZqLAnWxkv4LAKaHBhaxOrX5MbKkSPsfU7ylNfsqcDe2g0Kbfo2rzGEMM_Hss_UxM', 'Main view of Tactile Core-65.', 1),
    ('tactile-core-65', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzLHT59nxB33Z9pDwHPlvCTQqCr4WixIAjgCatmbHFIxChR2fWv__bBZ3TIVzxE32yeuf90LKFNE4D30Cih2ZV4vZgEJ7kyr9wucmJ9kg8Gun4HXFER2FZj8BAkA44sc7a7oi3uRkrOHf3IKgCRB3T3u-nHyqsLVWdhUPljoHTzA_vlVseE79DK68kXBnuGsu2jwp5Rp9T762HI3o5jSwuBr_bHvPnO1TZiDgQrDkR0J8vgcpeyn-JDeDiHJ1F-x-WNF18WKkNBXo', 'Keyboard detail on a minimalist workspace.', 2),
    ('tactile-core-65', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3inaalLfE5sedHjD-QKU1324XRS_2rzkVnuEKLrR4_aCj95CmeJcamttXrKApS7JxkqN8issdeKSJVoizU2KC1M_VyHyHVFLRYvVh8Ia4Hr8br1XxU1RWwtrgGS560fP1rf4FeZ89oND2CFWlOy_tTgNyiF7egU0RQmVTF-3PDVW1L7s1-NZyM7EbNqUFptf37rBgBFBTVCJHTFNq6gQGBW9toms1dHwS0vGWzT2tvsTKmhGDxOOBPPKMJXVXi5PrWP2hdsuTDZ8', 'Exploded diagram highlighting the internal keyboard layers.', 3),
    ('monolith-pro-tkl', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuwbaMA4JlosypPEdAmL0pcxh43Z99x-c0NUiSYxxGh75yP5aTVEritdJdxEUKJpZU6OhN7d_gTMUkZqiMPHcaG59g3PHoqwalSf4x_b4LKsufXDljYN0ocj_TAl5YT_gRlOizQQnRXKsI7BwTrNXSfYUI5mIA4U2AC8LrdAmu7egg7xgo4fxU_jG0DoXGpxYJTL1LPce9Sa0zYWmIipGQ5548ApKQnTGuOj8fFzPUrVWDGquwHnxjXKdMWC5Atkpk9z3-18VwB6I', 'Monolith Pro TKL in silver aluminum.', 1),
    ('monolith-pro-tkl', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQxiVTz86ehaz_BMK6njc7mThLkBnPxB75mroO_h_z1xZIWABgNzFOY7zrXWku6Mrlc5eXTt_CJYFKTPuau6dKd1QLFIcP-ov90oo2ws3KokX_ppCx3ivU8HZzHl6sNiM5-8_5sP18v_R_HUZ3h4FN_9s4yke53I51RNxowmatzwirmG_lpRUkWSV3xWrayns2DvTineikWyHLMCid9KXHKoqqDpOAdApT8IsNFCk-hxZkBD3SSOSBv58HFYpTZksreeWIHCVubks', 'Switches arranged in a precise grid.', 2),
    ('monolith-pro-tkl', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzLHT59nxB33Z9pDwHPlvCTQqCr4WixIAjgCatmbHFIxChR2fWv__bBZ3TIVzxE32yeuf90LKFNE4D30Cih2ZV4vZgEJ7kyr9wucmJ9kg8Gun4HXFER2FZj8BAkA44sc7a7oi3uRkrOHf3IKgCRB3T3u-nHyqsLVWdhUPljoHTzA_vlVseE79DK68kXBnuGsu2jwp5Rp9T762HI3o5jSwuBr_bHvPnO1TZiDgQrDkR0J8vgcpeyn-JDeDiHJ1F-x-WNF18WKkNBXo', 'Keyboard beside wood textures on a designer workspace.', 3),
    ('atlas-60', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVNCLpjY9c_utmK73a9IuYhnaStJwCPhy2tCy4vbZF_qMF4a_OElDEz7ZkBj0uKq-k81ethoB40zH-E1ixt48BADosISh3vC03bpj99tKC5xzUKwTjUq7TxekMVmQVvvtsELAzMOPyPOhsK2J7jnDlWDmM5kHK2Ic-r90tLTx6I-HSQjMdLcpBEOpgxCxqIAKcZMSK9HBXsF3rTaI8JAkx71sUIPZUJzIrvbt-_7YNY9lVx1L88wxNpZ7Zb25Bs3Vzel4RncAdlSI', 'Atlas-60 on white desk.', 1),
    ('atlas-60', 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6D96WQNSExc7laAdPQf4j-q3x8Erc-IB6-rn875IPMhgu78a3-xOvUomYfCOTFhQ9sVWduMDe2X5lL8Ttz0VvNFgw-Gb6eWgoLf8Hp21vbqNTxfkVY-TtWhNtsInOagLDzg-UHVIKHWQKO6bQ1GULGYe_c-zv8SplWzvVCtg6bERuoan6KqdbZoxPBHJ7DdZ8i7Ia4X7aNk2jpoVI0ZlFybICmy-kMHDxggkDvv3mWFBXQ8XfsXBexZENjQJh7EayqzNBgT1CMmU', 'Keycaps detail for Atlas-60.', 2),
    ('atlas-60', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQxiVTz86ehaz_BMK6njc7mThLkBnPxB75mroO_h_z1xZIWABgNzFOY7zrXWku6Mrlc5eXTt_CJYFKTPuau6dKd1QLFIcP-ov90oo2ws3KokX_ppCx3ivU8HZzHl6sNiM5-8_5sP18v_R_HUZ3h4FN_9s4yke53I51RNxowmatzwirmG_lpRUkWSV3xWrayns2DvTineikWyHLMCid9KXHKoqqDpOAdApT8IsNFCk-hxZkBD3SSOSBv58HFYpTZksreeWIHCVubks', 'Switches supporting Atlas-60.', 3),
    ('quiet-grid-keycap-set', 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6D96WQNSExc7laAdPQf4j-q3x8Erc-IB6-rn875IPMhgu78a3-xOvUomYfCOTFhQ9sVWduMDe2X5lL8Ttz0VvNFgw-Gb6eWgoLf8Hp21vbqNTxfkVY-TtWhNtsInOagLDzg-UHVIKHWQKO6bQ1GULGYe_c-zv8SplWzvVCtg6bERuoan6KqdbZoxPBHJ7DdZ8i7Ia4X7aNk2jpoVI0ZlFybICmy-kMHDxggkDvv3mWFBXQ8XfsXBexZENjQJh7EayqzNBgT1CMmU', 'Keycaps close-up.', 1),
    ('quiet-grid-keycap-set', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzLHT59nxB33Z9pDwHPlvCTQqCr4WixIAjgCatmbHFIxChR2fWv__bBZ3TIVzxE32yeuf90LKFNE4D30Cih2ZV4vZgEJ7kyr9wucmJ9kg8Gun4HXFER2FZj8BAkA44sc7a7oi3uRkrOHf3IKgCRB3T3u-nHyqsLVWdhUPljoHTzA_vlVseE79DK68kXBnuGsu2jwp5Rp9T762HI3o5jSwuBr_bHvPnO1TZiDgQrDkR0J8vgcpeyn-JDeDiHJ1F-x-WNF18WKkNBXo', 'Keycaps on workspace.', 2),
    ('quiet-grid-keycap-set', 'https://lh3.googleusercontent.com/aida-public/AB6AXuADzc-N6PUKuzJ7AXZ-i8XLTCCFOpIyGfPIr5YlwWhIJL5p4w0Y0lPtyb41grgiWEcKlHkV-k3UVDncc3_tDHF_vLix5utI710K2YXHQKwm4aqaBYFuw_s2cp-D-70wwkf86hdrRpVNegdq3IkqbpaXNwR0sc1jmQOofFc-GorAZy2ktc_d0DTuIRYS6jFT7yeq6r6UuAJEuX0ZqLAnWxkv4LAKaHBhaxOrX5MbKkSPsfU7ylNfsqcDe2g0Kbfo2rzGEMM_Hss_UxM', 'Keyboard fitted with Quiet Grid caps.', 3),
    ('atelier-desk-mat', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzLHT59nxB33Z9pDwHPlvCTQqCr4WixIAjgCatmbHFIxChR2fWv__bBZ3TIVzxE32yeuf90LKFNE4D30Cih2ZV4vZgEJ7kyr9wucmJ9kg8Gun4HXFER2FZj8BAkA44sc7a7oi3uRkrOHf3IKgCRB3T3u-nHyqsLVWdhUPljoHTzA_vlVseE79DK68kXBnuGsu2jwp5Rp9T762HI3o5jSwuBr_bHvPnO1TZiDgQrDkR0J8vgcpeyn-JDeDiHJ1F-x-WNF18WKkNBXo', 'Desk mat in use.', 1),
    ('atelier-desk-mat', 'https://lh3.googleusercontent.com/aida-public/AB6AXuADzc-N6PUKuzJ7AXZ-i8XLTCCFOpIyGfPIr5YlwWhIJL5p4w0Y0lPtyb41grgiWEcKlHkV-k3UVDncc3_tDHF_vLix5utI710K2YXHQKwm4aqaBYFuw_s2cp-D-70wwkf86hdrRpVNegdq3IkqbpaXNwR0sc1jmQOofFc-GorAZy2ktc_d0DTuIRYS6jFT7yeq6r6UuAJEuX0ZqLAnWxkv4LAKaHBhaxOrX5MbKkSPsfU7ylNfsqcDe2g0Kbfo2rzGEMM_Hss_UxM', 'Desk mat under keyboard.', 2),
    ('atelier-desk-mat', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVNCLpjY9c_utmK73a9IuYhnaStJwCPhy2tCy4vbZF_qMF4a_OElDEz7ZkBj0uKq-k81ethoB40zH-E1ixt48BADosISh3vC03bpj99tKC5xzUKwTjUq7TxekMVmQVvvtsELAzMOPyPOhsK2J7jnDlWDmM5kHK2Ic-r90tLTx6I-HSQjMdLcpBEOpgxCxqIAKcZMSK9HBXsF3rTaI8JAkx71sUIPZUJzIrvbt-_7YNY9lVx1L88wxNpZ7Zb25Bs3Vzel4RncAdlSI', 'Desk surface showing mat silhouette.', 3),
    ('obsidian-tactile-switch-pack', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQxiVTz86ehaz_BMK6njc7mThLkBnPxB75mroO_h_z1xZIWABgNzFOY7zrXWku6Mrlc5eXTt_CJYFKTPuau6dKd1QLFIcP-ov90oo2ws3KokX_ppCx3ivU8HZzHl6sNiM5-8_5sP18v_R_HUZ3h4FN_9s4yke53I51RNxowmatzwirmG_lpRUkWSV3xWrayns2DvTineikWyHLMCid9KXHKoqqDpOAdApT8IsNFCk-hxZkBD3SSOSBv58HFYpTZksreeWIHCVubks', 'Obsidian tactile switches.', 1),
    ('obsidian-tactile-switch-pack', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3inaalLfE5sedHjD-QKU1324XRS_2rzkVnuEKLrR4_aCj95CmeJcamttXrKApS7JxkqN8issdeKSJVoizU2KC1M_VyHyHVFLRYvVh8Ia4Hr8br1XxU1RWwtrgGS560fP1rf4FeZ89oND2CFWlOy_tTgNyiF7egU0RQmVTF-3PDVW1L7s1-NZyM7EbNqUFptf37rBgBFBTVCJHTFNq6gQGBW9toms1dHwS0vGWzT2tvsTKmhGDxOOBPPKMJXVXi5PrWP2hdsuTDZ8', 'Switches beside internal keyboard layers.', 2),
    ('obsidian-tactile-switch-pack', 'https://lh3.googleusercontent.com/aida-public/AB6AXuADzc-N6PUKuzJ7AXZ-i8XLTCCFOpIyGfPIr5YlwWhIJL5p4w0Y0lPtyb41grgiWEcKlHkV-k3UVDncc3_tDHF_vLix5utI710K2YXHQKwm4aqaBYFuw_s2cp-D-70wwkf86hdrRpVNegdq3IkqbpaXNwR0sc1jmQOofFc-GorAZy2ktc_d0DTuIRYS6jFT7yeq6r6UuAJEuX0ZqLAnWxkv4LAKaHBhaxOrX5MbKkSPsfU7ylNfsqcDe2g0Kbfo2rzGEMM_Hss_UxM', 'Switches installed in keyboard.', 3),
    ('brass-accent-plate', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3inaalLfE5sedHjD-QKU1324XRS_2rzkVnuEKLrR4_aCj95CmeJcamttXrKApS7JxkqN8issdeKSJVoizU2KC1M_VyHyHVFLRYvVh8Ia4Hr8br1XxU1RWwtrgGS560fP1rf4FeZ89oND2CFWlOy_tTgNyiF7egU0RQmVTF-3PDVW1L7s1-NZyM7EbNqUFptf37rBgBFBTVCJHTFNq6gQGBW9toms1dHwS0vGWzT2tvsTKmhGDxOOBPPKMJXVXi5PrWP2hdsuTDZ8', 'Brass plate component.', 1),
    ('brass-accent-plate', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuwbaMA4JlosypPEdAmL0pcxh43Z99x-c0NUiSYxxGh75yP5aTVEritdJdxEUKJpZU6OhN7d_gTMUkZqiMPHcaG59g3PHoqwalSf4x_b4LKsufXDljYN0ocj_TAl5YT_gRlOizQQnRXKsI7BwTrNXSfYUI5mIA4U2AC8LrdAmu7egg7xgo4fxU_jG0DoXGpxYJTL1LPce9Sa0zYWmIipGQ5548ApKQnTGuOj8fFzPUrVWDGquwHnxjXKdMWC5Atkpk9z3-18VwB6I', 'Keyboard chassis that fits brass plate.', 2),
    ('brass-accent-plate', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzLHT59nxB33Z9pDwHPlvCTQqCr4WixIAjgCatmbHFIxChR2fWv__bBZ3TIVzxE32yeuf90LKFNE4D30Cih2ZV4vZgEJ7kyr9wucmJ9kg8Gun4HXFER2FZj8BAkA44sc7a7oi3uRkrOHf3IKgCRB3T3u-nHyqsLVWdhUPljoHTzA_vlVseE79DK68kXBnuGsu2jwp5Rp9T762HI3o5jSwuBr_bHvPnO1TZiDgQrDkR0J8vgcpeyn-JDeDiHJ1F-x-WNF18WKkNBXo', 'Brass tone on desk composition.', 3)
) i(slug, image_src, image_alt, sort_order) ON i.slug = p.slug;

INSERT INTO dbo.product_specs (product_id, spec_label, spec_value, sort_order)
SELECT p.id, s.spec_label, s.spec_value, s.sort_order
FROM dbo.products p
JOIN (VALUES
    ('tactile-core-65', 'Mounting', 'Gasket mount', 1),
    ('tactile-core-65', 'Connectivity', 'Bluetooth 5.0 / 2.4GHz / USB-C', 2),
    ('tactile-core-65', 'Weight', '2.4kg fully built', 3),
    ('tactile-core-65', 'Latency', '1ms wired / 2ms wireless', 4),
    ('tactile-core-65', 'Plate', 'FR4 or brass', 5),
    ('tactile-core-65', 'Firmware', 'QMK / VIA compatible', 6),
    ('monolith-pro-tkl', 'Mounting', 'Leaf spring mount', 1),
    ('monolith-pro-tkl', 'Typing Angle', '7 degrees', 2),
    ('monolith-pro-tkl', 'Weight', '2.9kg fully built', 3),
    ('monolith-pro-tkl', 'Switch Support', '3-pin / 5-pin MX', 4),
    ('monolith-pro-tkl', 'Plate', 'Polycarbonate or aluminum', 5),
    ('monolith-pro-tkl', 'Finish', 'Micro-bead blasted anodization', 6),
    ('atlas-60', 'Mounting', 'Top mount', 1),
    ('atlas-60', 'Case', 'Ceramic-coated aluminum', 2),
    ('atlas-60', 'Weight', '1.8kg fully built', 3),
    ('atlas-60', 'Connectivity', 'USB-C only', 4),
    ('atlas-60', 'Layout', '60% ANSI / ISO', 5),
    ('atlas-60', 'Foam kit', 'Optional', 6),
    ('quiet-grid-keycap-set', 'Material', '1.5mm PBT', 1),
    ('quiet-grid-keycap-set', 'Profile', 'Cherry', 2),
    ('quiet-grid-keycap-set', 'Compatibility', 'ANSI / ISO / TKL / 65%', 3),
    ('quiet-grid-keycap-set', 'Texture', 'Dry matte', 4),
    ('atelier-desk-mat', 'Size', '900 x 400mm', 1),
    ('atelier-desk-mat', 'Material', 'Wool blend felt', 2),
    ('atelier-desk-mat', 'Backing', 'Natural rubber', 3),
    ('atelier-desk-mat', 'Thickness', '4mm', 4),
    ('obsidian-tactile-switch-pack', 'Count', '90 switches', 1),
    ('obsidian-tactile-switch-pack', 'Stem', 'Long-pole POM', 2),
    ('obsidian-tactile-switch-pack', 'Spring', '53g dual-stage', 3),
    ('obsidian-tactile-switch-pack', 'Factory prep', 'Light rails lubrication', 4),
    ('brass-accent-plate', 'Layout support', '65% / TKL', 1),
    ('brass-accent-plate', 'Material', '1.5mm machined brass', 2),
    ('brass-accent-plate', 'Finish', 'Brushed satin', 3),
    ('brass-accent-plate', 'Acoustics', 'Brighter attack, longer decay', 4)
) s(slug, spec_label, spec_value, sort_order) ON s.slug = p.slug;

INSERT INTO dbo.product_highlights (product_id, highlight_text, sort_order)
SELECT p.id, h.highlight_text, h.sort_order
FROM dbo.products p
JOIN (VALUES
    ('tactile-core-65', 'Seven-layer acoustic stack', 1),
    ('tactile-core-65', 'Powder-coated internal weight', 2),
    ('tactile-core-65', 'Low-gloss stone finish', 3),
    ('monolith-pro-tkl', 'Balanced top frame overhang', 1),
    ('monolith-pro-tkl', 'Low-sheen bead blast finish', 2),
    ('monolith-pro-tkl', 'Dense, rounded bottom-out', 3),
    ('atlas-60', 'Compact desk footprint', 1),
    ('atlas-60', 'Crisp top-mount response', 2),
    ('atlas-60', 'Light visual mass', 3),
    ('quiet-grid-keycap-set', 'Muted legend contrast', 1),
    ('quiet-grid-keycap-set', 'Subtle off-white tonality', 2),
    ('quiet-grid-keycap-set', 'Wide layout support', 3),
    ('atelier-desk-mat', 'Low-noise desk surface', 1),
    ('atelier-desk-mat', 'Natural, slightly warm tonality', 2),
    ('atelier-desk-mat', 'Anti-slip rubber base', 3),
    ('obsidian-tactile-switch-pack', 'Rounded tactile event', 1),
    ('obsidian-tactile-switch-pack', 'Quiet nylon housing', 2),
    ('obsidian-tactile-switch-pack', 'Long-pole clarity', 3),
    ('brass-accent-plate', 'Denser key feel', 1),
    ('brass-accent-plate', 'Warmer metallic undertone', 2),
    ('brass-accent-plate', 'Precision-cut switch openings', 3)
) h(slug, highlight_text, sort_order) ON h.slug = p.slug;

INSERT INTO dbo.product_options (product_id, option_key, option_group_name, sort_order)
SELECT p.id, o.option_key, o.option_group_name, o.sort_order
FROM dbo.products p
JOIN (VALUES
    ('tactile-core-65', 'switches', 'Switch Variant', 1),
    ('tactile-core-65', 'plate', 'Plate Material', 2),
    ('monolith-pro-tkl', 'switches', 'Switch Variant', 1),
    ('monolith-pro-tkl', 'weight', 'Bottom Weight', 2),
    ('atlas-60', 'switches', 'Switch Variant', 1),
    ('quiet-grid-keycap-set', 'legend', 'Legend Style', 1),
    ('atelier-desk-mat', 'color', 'Colorway', 1),
    ('obsidian-tactile-switch-pack', 'pack', 'Pack Size', 1),
    ('brass-accent-plate', 'layout', 'Layout', 1)
) o(slug, option_key, option_group_name, sort_order) ON o.slug = p.slug;

INSERT INTO dbo.product_option_values (product_option_id, option_value_key, label, price_delta, sort_order)
SELECT po.id, pov.option_value_key, pov.label, pov.price_delta, pov.sort_order
FROM dbo.product_options po
JOIN dbo.products p ON p.id = po.product_id
JOIN (VALUES
    ('tactile-core-65', 'switches', 'obsidian-tactile', 'Obsidian Tactile', 0.00, 1),
    ('tactile-core-65', 'switches', 'cream-linear', 'Cream Linear', 0.00, 2),
    ('tactile-core-65', 'plate', 'fr4', 'FR4', 0.00, 1),
    ('tactile-core-65', 'plate', 'brass', 'Brass', 30.00, 2),
    ('monolith-pro-tkl', 'switches', 'marble-tactile', 'Marble Tactile', 20.00, 1),
    ('monolith-pro-tkl', 'switches', 'mistral-linear', 'Mistral Linear', 0.00, 2),
    ('monolith-pro-tkl', 'weight', 'stone', 'Powder-coated stone', 0.00, 1),
    ('monolith-pro-tkl', 'weight', 'polished-brass', 'Polished brass', 50.00, 2),
    ('atlas-60', 'switches', 'linen-linear', 'Linen Linear', 0.00, 1),
    ('atlas-60', 'switches', 'carbon-tactile', 'Carbon Tactile', 15.00, 2),
    ('quiet-grid-keycap-set', 'legend', 'standard', 'Standard', 0.00, 1),
    ('quiet-grid-keycap-set', 'legend', 'blank', 'Blank alphas', 10.00, 2),
    ('atelier-desk-mat', 'color', 'ash', 'Ash', 0.00, 1),
    ('atelier-desk-mat', 'color', 'stone', 'Stone', 0.00, 2),
    ('obsidian-tactile-switch-pack', 'pack', '90', '90 switches', 0.00, 1),
    ('obsidian-tactile-switch-pack', 'pack', '110', '110 switches', 12.00, 2),
    ('brass-accent-plate', 'layout', '65', '65%', 0.00, 1),
    ('brass-accent-plate', 'layout', 'tkl', 'TKL', 5.00, 2)
) pov(slug, option_key, option_value_key, label, price_delta, sort_order)
    ON pov.slug = p.slug
   AND pov.option_key = po.option_key;

INSERT INTO dbo.orders (
    order_number,
    user_id,
    customer_name,
    customer_email,
    status,
    total_amount,
    item_count,
    fulfillment,
    shipping_line1,
    shipping_city,
    shipping_postal_code,
    shipping_country,
    payment_status,
    created_at
)
VALUES
    (
        'TG-2048',
        (SELECT id FROM dbo.app_users WHERE external_id = 'user-atelier'),
        'Atelier Member',
        'member@tactile.gallery',
        'Delivered',
        588.00,
        2,
        'Complete',
        '49 Charoen Nakhon Rd',
        'Bangkok',
        '10600',
        'Thailand',
        'Paid',
        '2026-03-21T10:00:00'
    ),
    (
        'TG-2084',
        NULL,
        'Studio North',
        'ops@studionorth.co',
        'Processing',
        420.00,
        1,
        'Picking parts',
        '231 Soi Ari 4',
        'Bangkok',
        '10400',
        'Thailand',
        'Paid',
        '2026-03-28T09:00:00'
    ),
    (
        'TG-2091',
        NULL,
        'Narin P.',
        'narin@atelier.example',
        'Ready to Ship',
        170.00,
        2,
        'Packed and labeled',
        '88 Sukhumvit 55',
        'Bangkok',
        '10110',
        'Thailand',
        'Paid',
        '2026-04-02T14:30:00'
    ),
    (
        'TG-2098',
        NULL,
        'Quiet Works',
        'team@quietworks.dev',
        'Payment Review',
        595.00,
        3,
        'Awaiting payment confirmation',
        '77 Wireless Rd',
        'Bangkok',
        '10330',
        'Thailand',
        'Review',
        '2026-04-05T15:00:00'
    );

INSERT INTO dbo.order_timeline_entries (order_id, timeline_text, sort_order)
SELECT o.id, t.timeline_text, t.sort_order
FROM dbo.orders o
JOIN (VALUES
    ('TG-2048', 'Order placed', 1),
    ('TG-2048', 'Assembly completed', 2),
    ('TG-2048', 'Delivered', 3),
    ('TG-2084', 'Order placed', 1),
    ('TG-2084', 'Payment captured', 2),
    ('TG-2084', 'Picking parts', 3),
    ('TG-2091', 'Order placed', 1),
    ('TG-2091', 'Assembly completed', 2),
    ('TG-2091', 'Packed and labeled', 3),
    ('TG-2098', 'Order placed', 1),
    ('TG-2098', 'Payment flagged', 2),
    ('TG-2098', 'Awaiting review', 3)
) t(order_number, timeline_text, sort_order) ON t.order_number = o.order_number;

INSERT INTO dbo.order_items (
    order_id,
    product_id,
    product_slug,
    product_name,
    image_src,
    image_alt,
    unit_price,
    quantity,
    selected_options_json
)
SELECT
    o.id,
    p.id,
    oi.product_slug,
    oi.product_name,
    oi.image_src,
    oi.image_alt,
    oi.unit_price,
    oi.quantity,
    oi.selected_options_json
FROM dbo.orders o
JOIN (VALUES
    ('TG-2048', 'monolith-pro-tkl', 'Monolith Pro TKL', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuwbaMA4JlosypPEdAmL0pcxh43Z99x-c0NUiSYxxGh75yP5aTVEritdJdxEUKJpZU6OhN7d_gTMUkZqiMPHcaG59g3PHoqwalSf4x_b4LKsufXDljYN0ocj_TAl5YT_gRlOizQQnRXKsI7BwTrNXSfYUI5mIA4U2AC8LrdAmu7egg7xgo4fxU_jG0DoXGpxYJTL1LPce9Sa0zYWmIipGQ5548ApKQnTGuOj8fFzPUrVWDGquwHnxjXKdMWC5Atkpk9z3-18VwB6I', 'Monolith Pro TKL preview.', 520.00, 1, '{"Switch Variant":"Mistral Linear","Bottom Weight":"Powder-coated stone"}'),
    ('TG-2048', 'atelier-desk-mat', 'Atelier Desk Mat', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzLHT59nxB33Z9pDwHPlvCTQqCr4WixIAjgCatmbHFIxChR2fWv__bBZ3TIVzxE32yeuf90LKFNE4D30Cih2ZV4vZgEJ7kyr9wucmJ9kg8Gun4HXFER2FZj8BAkA44sc7a7oi3uRkrOHf3IKgCRB3T3u-nHyqsLVWdhUPljoHTzA_vlVseE79DK68kXBnuGsu2jwp5Rp9T762HI3o5jSwuBr_bHvPnO1TZiDgQrDkR0J8vgcpeyn-JDeDiHJ1F-x-WNF18WKkNBXo', 'Atelier Desk Mat preview.', 68.00, 1, '{"Colorway":"Ash"}'),
    ('TG-2084', 'tactile-core-65', 'Tactile Core-65', 'https://lh3.googleusercontent.com/aida-public/AB6AXuADzc-N6PUKuzJ7AXZ-i8XLTCCFOpIyGfPIr5YlwWhIJL5p4w0Y0lPtyb41grgiWEcKlHkV-k3UVDncc3_tDHF_vLix5utI710K2YXHQKwm4aqaBYFuw_s2cp-D-70wwkf86hdrRpVNegdq3IkqbpaXNwR0sc1jmQOofFc-GorAZy2ktc_d0DTuIRYS6jFT7yeq6r6UuAJEuX0ZqLAnWxkv4LAKaHBhaxOrX5MbKkSPsfU7ylNfsqcDe2g0Kbfo2rzGEMM_Hss_UxM', 'Tactile Core-65 preview.', 420.00, 1, '{"Switch Variant":"Obsidian Tactile","Plate Material":"FR4"}'),
    ('TG-2091', 'quiet-grid-keycap-set', 'Quiet Grid Keycap Set', 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6D96WQNSExc7laAdPQf4j-q3x8Erc-IB6-rn875IPMhgu78a3-xOvUomYfCOTFhQ9sVWduMDe2X5lL8Ttz0VvNFgw-Gb6eWgoLf8Hp21vbqNTxfkVY-TtWhNtsInOagLDzg-UHVIKHWQKO6bQ1GULGYe_c-zv8SplWzvVCtg6bERuoan6KqdbZoxPBHJ7DdZ8i7Ia4X7aNk2jpoVI0ZlFybICmy-kMHDxggkDvv3mWFBXQ8XfsXBexZENjQJh7EayqzNBgT1CMmU', 'Quiet Grid Keycap Set preview.', 95.00, 1, '{"Legend Style":"Standard"}'),
    ('TG-2091', 'atelier-desk-mat', 'Atelier Desk Mat', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzLHT59nxB33Z9pDwHPlvCTQqCr4WixIAjgCatmbHFIxChR2fWv__bBZ3TIVzxE32yeuf90LKFNE4D30Cih2ZV4vZgEJ7kyr9wucmJ9kg8Gun4HXFER2FZj8BAkA44sc7a7oi3uRkrOHf3IKgCRB3T3u-nHyqsLVWdhUPljoHTzA_vlVseE79DK68kXBnuGsu2jwp5Rp9T762HI3o5jSwuBr_bHvPnO1TZiDgQrDkR0J8vgcpeyn-JDeDiHJ1F-x-WNF18WKkNBXo', 'Atelier Desk Mat preview.', 75.00, 1, '{"Colorway":"Stone"}'),
    ('TG-2098', 'monolith-pro-tkl', 'Monolith Pro TKL', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuwbaMA4JlosypPEdAmL0pcxh43Z99x-c0NUiSYxxGh75yP5aTVEritdJdxEUKJpZU6OhN7d_gTMUkZqiMPHcaG59g3PHoqwalSf4x_b4LKsufXDljYN0ocj_TAl5YT_gRlOizQQnRXKsI7BwTrNXSfYUI5mIA4U2AC8LrdAmu7egg7xgo4fxU_jG0DoXGpxYJTL1LPce9Sa0zYWmIipGQ5548ApKQnTGuOj8fFzPUrVWDGquwHnxjXKdMWC5Atkpk9z3-18VwB6I', 'Monolith Pro TKL preview.', 520.00, 1, '{"Switch Variant":"Mistral Linear","Bottom Weight":"Powder-coated stone"}'),
    ('TG-2098', 'obsidian-tactile-switch-pack', 'Obsidian Tactile Switch Pack', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQxiVTz86ehaz_BMK6njc7mThLkBnPxB75mroO_h_z1xZIWABgNzFOY7zrXWku6Mrlc5eXTt_CJYFKTPuau6dKd1QLFIcP-ov90oo2ws3KokX_ppCx3ivU8HZzHl6sNiM5-8_5sP18v_R_HUZ3h4FN_9s4yke53I51RNxowmatzwirmG_lpRUkWSV3xWrayns2DvTineikWyHLMCid9KXHKoqqDpOAdApT8IsNFCk-hxZkBD3SSOSBv58HFYpTZksreeWIHCVubks', 'Obsidian Tactile Switch Pack preview.', 58.00, 1, '{"Pack Size":"90 switches"}'),
    ('TG-2098', 'brass-accent-plate', 'Brass Accent Plate', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3inaalLfE5sedHjD-QKU1324XRS_2rzkVnuEKLrR4_aCj95CmeJcamttXrKApS7JxkqN8issdeKSJVoizU2KC1M_VyHyHVFLRYvVh8Ia4Hr8br1XxU1RWwtrgGS560fP1rf4FeZ89oND2CFWlOy_tTgNyiF7egU0RQmVTF-3PDVW1L7s1-NZyM7EbNqUFptf37rBgBFBTVCJHTFNq6gQGBW9toms1dHwS0vGWzT2tvsTKmhGDxOOBPPKMJXVXi5PrWP2hdsuTDZ8', 'Brass Accent Plate preview.', 17.00, 1, '{"Layout":"TKL"}')
) oi(order_number, product_slug, product_name, image_src, image_alt, unit_price, quantity, selected_options_json)
    ON oi.order_number = o.order_number
JOIN dbo.products p ON p.slug = oi.product_slug;
