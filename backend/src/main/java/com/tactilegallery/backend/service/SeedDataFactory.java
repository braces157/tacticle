package com.tactilegallery.backend.service;

import com.tactilegallery.backend.model.DomainModels;
import java.util.List;
import java.util.Map;

final class SeedDataFactory {

    private static final String HERO_IMAGE =
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDVNCLpjY9c_utmK73a9IuYhnaStJwCPhy2tCy4vbZF_qMF4a_OElDEz7ZkBj0uKq-k81ethoB40zH-E1ixt48BADosISh3vC03bpj99tKC5xzUKwTjUq7TxekMVmQVvvtsELAzMOPyPOhsK2J7jnDlWDmM5kHK2Ic-r90tLTx6I-HSQjMdLcpBEOpgxCxqIAKcZMSK9HBXsF3rTaI8JAkx71sUIPZUJzIrvbt-_7YNY9lVx1L88wxNpZ7Zb25Bs3Vzel4RncAdlSI";
    private static final String DETAIL_IMAGE =
        "https://lh3.googleusercontent.com/aida-public/AB6AXuADzc-N6PUKuzJ7AXZ-i8XLTCCFOpIyGfPIr5YlwWhIJL5p4w0Y0lPtyb41grgiWEcKlHkV-k3UVDncc3_tDHF_vLix5utI710K2YXHQKwm4aqaBYFuw_s2cp-D-70wwkf86hdrRpVNegdq3IkqbpaXNwR0sc1jmQOofFc-GorAZy2ktc_d0DTuIRYS6jFT7yeq6r6UuAJEuX0ZqLAnWxkv4LAKaHBhaxOrX5MbKkSPsfU7ylNfsqcDe2g0Kbfo2rzGEMM_Hss_UxM";
    private static final String SWITCHES_IMAGE =
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDQxiVTz86ehaz_BMK6njc7mThLkBnPxB75mroO_h_z1xZIWABgNzFOY7zrXWku6Mrlc5eXTt_CJYFKTPuau6dKd1QLFIcP-ov90oo2ws3KokX_ppCx3ivU8HZzHl6sNiM5-8_5sP18v_R_HUZ3h4FN_9s4yke53I51RNxowmatzwirmG_lpRUkWSV3xWrayns2DvTineikWyHLMCid9KXHKoqqDpOAdApT8IsNFCk-hxZkBD3SSOSBv58HFYpTZksreeWIHCVubks";
    private static final String KEYCAPS_IMAGE =
        "https://lh3.googleusercontent.com/aida-public/AB6AXuD6D96WQNSExc7laAdPQf4j-q3x8Erc-IB6-rn875IPMhgu78a3-xOvUomYfCOTFhQ9sVWduMDe2X5lL8Ttz0VvNFgw-Gb6eWgoLf8Hp21vbqNTxfkVY-TtWhNtsInOagLDzg-UHVIKHWQKO6bQ1GULGYe_c-zv8SplWzvVCtg6bERuoan6KqdbZoxPBHJ7DdZ8i7Ia4X7aNk2jpoVI0ZlFybICmy-kMHDxggkDvv3mWFBXQ8XfsXBexZENjQJh7EayqzNBgT1CMmU";
    private static final String EXPLODED_IMAGE =
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC3inaalLfE5sedHjD-QKU1324XRS_2rzkVnuEKLrR4_aCj95CmeJcamttXrKApS7JxkqN8issdeKSJVoizU2KC1M_VyHyHVFLRYvVh8Ia4Hr8br1XxU1RWwtrgGS560fP1rf4FeZ89oND2CFWlOy_tTgNyiF7egU0RQmVTF-3PDVW1L7s1-NZyM7EbNqUFptf37rBgBFBTVCJHTFNq6gQGBW9toms1dHwS0vGWzT2tvsTKmhGDxOOBPPKMJXVXi5PrWP2hdsuTDZ8";
    private static final String WORKSPACE_IMAGE =
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDzLHT59nxB33Z9pDwHPlvCTQqCr4WixIAjgCatmbHFIxChR2fWv__bBZ3TIVzxE32yeuf90LKFNE4D30Cih2ZV4vZgEJ7kyr9wucmJ9kg8Gun4HXFER2FZj8BAkA44sc7a7oi3uRkrOHf3IKgCRB3T3u-nHyqsLVWdhUPljoHTzA_vlVseE79DK68kXBnuGsu2jwp5Rp9T762HI3o5jSwuBr_bHvPnO1TZiDgQrDkR0J8vgcpeyn-JDeDiHJ1F-x-WNF18WKkNBXo";
    private static final String ACRYLIC_IMAGE =
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBuwbaMA4JlosypPEdAmL0pcxh43Z99x-c0NUiSYxxGh75yP5aTVEritdJdxEUKJpZU6OhN7d_gTMUkZqiMPHcaG59g3PHoqwalSf4x_b4LKsufXDljYN0ocj_TAl5YT_gRlOizQQnRXKsI7BwTrNXSfYUI5mIA4U2AC8LrdAmu7egg7xgo4fxU_jG0DoXGpxYJTL1LPce9Sa0zYWmIipGQ5548ApKQnTGuOj8fFzPUrVWDGquwHnxjXKdMWC5Atkpk9z3-18VwB6I";
    private static final String ADMIN_HERO_IMAGE =
        "https://lh3.googleusercontent.com/aida-public/AB6AXuD09IY_UI2JClALkHQkXNIzgK5VgyxJQ-fLNsVv5GTaVYC_c5cVZCxcljCwNCJvb_VIwG7mJQyRzaULUAIUxf4fA4pjk2Tc8y85i_kNB9S8wb3GBsVaz7OmAXuKJuW4SVwAitvuZ34CtMp3UCFNg1Csyp6S0xdZVMeLWsSpL87MAMMEHs4AtriGFI2Pe8Ndc72pfbn2pUNeq_rflnH_AWG7RCZYIIYrdjvtveB4ua8HQVaO00GAKeuuW-Z5-pnMf58cCAJ4hd1r_1E";

    record SeedState(
        List<DomainModels.Category> categories,
        List<DomainModels.AdminProductRecord> products,
        List<InMemoryStore.StoredUser> users,
        DomainModels.UserProfile defaultProfile,
        List<DomainModels.AdminOrderDetail> orders,
        List<String> featuredProductSlugs,
        int highestOrderNumber,
        String adminHeroImage
    ) {
    }

    private SeedDataFactory() {
    }

    static SeedState create() {
        DomainModels.AuthUser defaultUser =
            new DomainModels.AuthUser("user-atelier", "Atelier Member", "member@tactile.gallery", "customer");
        DomainModels.AuthUser defaultAdmin =
            new DomainModels.AuthUser("admin-tactile", "Admin User", "admin@tactile.gallery", "admin");

        List<DomainModels.Category> categories = buildCategories();
        List<DomainModels.AdminProductRecord> products = buildProducts();
        List<InMemoryStore.StoredUser> users = List.of(
            new InMemoryStore.StoredUser(defaultUser.id(), defaultUser.name(), defaultUser.email(), defaultUser.role(), "quiet"),
            new InMemoryStore.StoredUser(defaultAdmin.id(), defaultAdmin.name(), defaultAdmin.email(), defaultAdmin.role(), "quiet")
        );

        DomainModels.UserProfile defaultProfile = new DomainModels.UserProfile(
            defaultUser.id(),
            defaultUser.name(),
            defaultUser.email(),
            "Bangkok, Thailand",
            "",
            "Gallery Member since 2024",
            List.of("Quiet tactility", "Stone-toned finishes", "65% layouts"),
            address("49 Charoen Nakhon Rd", "Bangkok", "10600", "Thailand"),
            address("49 Charoen Nakhon Rd", "Bangkok", "10600", "Thailand")
        );

        return new SeedState(
            categories,
            products,
            users,
            defaultProfile,
            buildOrders(defaultUser),
            List.of("tactile-core-65", "quiet-grid-keycap-set", "obsidian-tactile-switch-pack"),
            2098,
            ADMIN_HERO_IMAGE
        );
    }

    private static List<DomainModels.Category> buildCategories() {
        return List.of(
            new DomainModels.Category(
                "cat-keyboards",
                "keyboards",
                "Keyboards",
                "Exhibition / 01",
                "Silent precision in machined aluminum.",
                "Gallery-grade keyboard builds tuned for structure, acoustics, and tactile calm.",
                "Each chassis is curated for acoustic maturity, compositional balance, and the quiet confidence of a desk object that earns its space.",
                image(HERO_IMAGE, "Top-down view of an all-white mechanical keyboard on a minimal desk.")
            ),
            new DomainModels.Category(
                "cat-accessories",
                "accessories",
                "Accessories",
                "Exhibition / 02",
                "Support pieces with typographic discipline.",
                "Desk mats, artisan caps, and finishing touches that extend the same editorial language.",
                "Accessories in Tactile are never filler. They exist to soften, ground, or sharpen the primary keyboard silhouette.",
                image(KEYCAPS_IMAGE, "Macro photo of minimalist keycaps under soft studio lighting.")
            ),
            new DomainModels.Category(
                "cat-custom-parts",
                "custom-parts",
                "Custom Parts",
                "Exhibition / 03",
                "Internal architecture, visible in feel.",
                "Switches, knobs, plates, and tuned internals for builders who care about every layer.",
                "The sound and sensation of a build is made long before the first keypress. These parts shape the final voice.",
                image(EXPLODED_IMAGE, "Exploded diagram of a keyboard with gaskets, PCB, and plate layers.")
            )
        );
    }

    private static List<DomainModels.AdminProductRecord> buildProducts() {
        return List.of(
            new DomainModels.AdminProductRecord(
                "prod-core-65", "tactile-core-65", "keyboards", "Tactile Core-65",
                "A quiet 65% frame balanced for marbly, low-register acoustics.", 420,
                image(DETAIL_IMAGE, "Minimal mechanical keyboard with matte gray keycaps on white stone."),
                List.of("Wireless", "Gallery Favorite", "65%"), "CNC aluminum",
                List.of(
                    image(DETAIL_IMAGE, "Main view of Tactile Core-65."),
                    image(WORKSPACE_IMAGE, "Keyboard detail on a minimalist workspace."),
                    image(EXPLODED_IMAGE, "Exploded diagram highlighting the internal keyboard layers.")
                ),
                "A softly weighted 65% layout with gasket isolation, tuned poron, and a surface finish that reads like stoneware under daylight.",
                "The Core-65 exists for people who want restraint rather than spectacle. Every visible edge is softened by spacing and every internal layer is tuned for acoustic clarity.",
                List.of(
                    spec("Mounting", "Gasket mount"),
                    spec("Connectivity", "Bluetooth 5.0 / 2.4GHz / USB-C"),
                    spec("Weight", "2.4kg fully built"),
                    spec("Latency", "1ms wired / 2ms wireless"),
                    spec("Plate", "FR4 or brass"),
                    spec("Firmware", "QMK / VIA compatible")
                ),
                List.of("Seven-layer acoustic stack", "Powder-coated internal weight", "Low-gloss stone finish"),
                List.of(
                    option("switches", "Switch Variant", value("obsidian-tactile", "Obsidian Tactile", 0), value("cream-linear", "Cream Linear", 0)),
                    option("plate", "Plate Material", value("fr4", "FR4", 0), value("brass", "Brass", 30))
                ),
                "KB-TC-065", 12, "Active", false
            ),
            new DomainModels.AdminProductRecord(
                "prod-monolith-pro", "monolith-pro-tkl", "keyboards", "Monolith Pro TKL",
                "A tenkeyless chassis with denser mass and a flatter studio posture.", 520,
                image(ACRYLIC_IMAGE, "High-end custom keyboard chassis made of frosted acrylic and silver aluminum."),
                List.of("TKL", "Studio", "Premium"), "Silver aluminum",
                List.of(
                    image(ACRYLIC_IMAGE, "Monolith Pro TKL in silver aluminum."),
                    image(SWITCHES_IMAGE, "Switches arranged in a precise grid."),
                    image(WORKSPACE_IMAGE, "Keyboard beside wood textures on a designer workspace.")
                ),
                "A commanding TKL platform with a muted profile, expanded desk presence, and sharper acoustic separation for writers who prefer a firmer bottom-out.",
                "The Monolith line is built around optical centering: nothing is mathematically centered, but every proportion feels composed.",
                List.of(
                    spec("Mounting", "Leaf spring mount"),
                    spec("Typing Angle", "7 degrees"),
                    spec("Weight", "2.9kg fully built"),
                    spec("Switch Support", "3-pin / 5-pin MX"),
                    spec("Plate", "Polycarbonate or aluminum"),
                    spec("Finish", "Micro-bead blasted anodization")
                ),
                List.of("Balanced top frame overhang", "Low-sheen bead blast finish", "Dense, rounded bottom-out"),
                List.of(
                    option("switches", "Switch Variant", value("marble-tactile", "Marble Tactile", 20), value("mistral-linear", "Mistral Linear", 0)),
                    option("weight", "Bottom Weight", value("stone", "Powder-coated stone", 0), value("polished-brass", "Polished brass", 50))
                ),
                "KB-MP-TKL", 4, "Active", false
            ),
            new DomainModels.AdminProductRecord(
                "prod-atlas-60", "atlas-60", "keyboards", "Atlas-60",
                "Compact minimalism with a brighter, springier acoustic profile.", 365,
                image(HERO_IMAGE, "Compact 60% keyboard in soft natural lighting."),
                List.of("60%", "Portable", "Minimal"), "Ceramic-coated aluminum",
                List.of(
                    image(HERO_IMAGE, "Atlas-60 on white desk."),
                    image(KEYCAPS_IMAGE, "Keycaps detail for Atlas-60."),
                    image(SWITCHES_IMAGE, "Switches supporting Atlas-60.")
                ),
                "Atlas-60 distills the Tactile language into a compact footprint that still feels architectural and grown-up.",
                "Where the Core-65 is soft and grounded, Atlas-60 is brisk and composed, intended for mobile desks and tighter work zones.",
                List.of(
                    spec("Mounting", "Top mount"),
                    spec("Case", "Ceramic-coated aluminum"),
                    spec("Weight", "1.8kg fully built"),
                    spec("Connectivity", "USB-C only"),
                    spec("Layout", "60% ANSI / ISO"),
                    spec("Foam kit", "Optional")
                ),
                List.of("Compact desk footprint", "Crisp top-mount response", "Light visual mass"),
                List.of(option("switches", "Switch Variant", value("linen-linear", "Linen Linear", 0), value("carbon-tactile", "Carbon Tactile", 15))),
                "KB-AT-060", 0, "Hidden", false
            ),
            new DomainModels.AdminProductRecord(
                "prod-quiet-grid", "quiet-grid-keycap-set", "accessories", "Quiet Grid Keycap Set",
                "Low-contrast legends and crisp typography across every row.", 95,
                image(KEYCAPS_IMAGE, "Minimal white keycaps with subtle legends."),
                List.of("PBT", "Cherry profile", "Typographic"), "Dye-sub PBT",
                List.of(
                    image(KEYCAPS_IMAGE, "Keycaps close-up."),
                    image(WORKSPACE_IMAGE, "Keycaps on workspace."),
                    image(DETAIL_IMAGE, "Keyboard fitted with Quiet Grid caps.")
                ),
                "A dense PBT set with softened legends and a creamy off-white tone that pairs with cold metals and light woods.",
                "The legend design intentionally pulls back to let the keyboard silhouette lead.",
                List.of(
                    spec("Material", "1.5mm PBT"),
                    spec("Profile", "Cherry"),
                    spec("Compatibility", "ANSI / ISO / TKL / 65%"),
                    spec("Texture", "Dry matte")
                ),
                List.of("Muted legend contrast", "Subtle off-white tonality", "Wide layout support"),
                List.of(option("legend", "Legend Style", value("standard", "Standard", 0), value("blank", "Blank alphas", 10))),
                "AC-QG-CAP", 18, "Active", false
            ),
            new DomainModels.AdminProductRecord(
                "prod-felt-mat", "atelier-desk-mat", "accessories", "Atelier Desk Mat",
                "A tonal desk surface that quiets resonance and frames the board.", 68,
                image(WORKSPACE_IMAGE, "Desk mat on a designer's workspace."),
                List.of("Felt", "Desk setup", "Acoustic"), "Wool blend felt",
                List.of(
                    image(WORKSPACE_IMAGE, "Desk mat in use."),
                    image(DETAIL_IMAGE, "Desk mat under keyboard."),
                    image(HERO_IMAGE, "Desk surface showing mat silhouette.")
                ),
                "A weighty felt mat that absorbs harsh frequencies and provides a calm visual plane for lighter keyboard finishes.",
                "The desk mat is treated as an environmental layer, not an accessory add-on.",
                List.of(
                    spec("Size", "900 x 400mm"),
                    spec("Material", "Wool blend felt"),
                    spec("Backing", "Natural rubber"),
                    spec("Thickness", "4mm")
                ),
                List.of("Low-noise desk surface", "Natural, slightly warm tonality", "Anti-slip rubber base"),
                List.of(option("color", "Colorway", value("ash", "Ash", 0), value("stone", "Stone", 0))),
                "AC-AT-MAT", 25, "Active", false
            ),
            new DomainModels.AdminProductRecord(
                "prod-obsidian-switch", "obsidian-tactile-switch-pack", "custom-parts", "Obsidian Tactile Switch Pack",
                "A rounded tactile bump with a darker, denser after-sound.", 58,
                image(SWITCHES_IMAGE, "Mechanical keyboard switches arranged in a grid."),
                List.of("Switches", "Tactile", "Hand-lubed"), "Nylon / POM",
                List.of(
                    image(SWITCHES_IMAGE, "Obsidian tactile switches."),
                    image(EXPLODED_IMAGE, "Switches beside internal keyboard layers."),
                    image(DETAIL_IMAGE, "Switches installed in keyboard.")
                ),
                "Designed for builders who want tactility without scratch. Obsidian leans toward a quiet, rounded note rather than a sharp click.",
                "Switch choice is one of the final determinants of character, so this pack is tuned to preserve composure even at speed.",
                List.of(
                    spec("Count", "90 switches"),
                    spec("Stem", "Long-pole POM"),
                    spec("Spring", "53g dual-stage"),
                    spec("Factory prep", "Light rails lubrication")
                ),
                List.of("Rounded tactile event", "Quiet nylon housing", "Long-pole clarity"),
                List.of(option("pack", "Pack Size", value("90", "90 switches", 0), value("110", "110 switches", 12))),
                "CP-OB-090", 3, "Active", false
            ),
            new DomainModels.AdminProductRecord(
                "prod-brass-plate", "brass-accent-plate", "custom-parts", "Brass Accent Plate",
                "A denser plate that adds shimmer, mass, and visual warmth.", 75,
                image(EXPLODED_IMAGE, "Keyboard internal plate in exploded layout."),
                List.of("Plate", "Brass", "Weight"), "Machined brass",
                List.of(
                    image(EXPLODED_IMAGE, "Brass plate component."),
                    image(ACRYLIC_IMAGE, "Keyboard chassis that fits brass plate."),
                    image(WORKSPACE_IMAGE, "Brass tone on desk composition.")
                ),
                "A plate for builders seeking more mass, cleaner resonance, and a warmer metallic undertone in the typing feel.",
                "It is a technical part, but it also changes the emotional read of the whole board.",
                List.of(
                    spec("Layout support", "65% / TKL"),
                    spec("Material", "1.5mm machined brass"),
                    spec("Finish", "Brushed satin"),
                    spec("Acoustics", "Brighter attack, longer decay")
                ),
                List.of("Denser key feel", "Warmer metallic undertone", "Precision-cut switch openings"),
                List.of(option("layout", "Layout", value("65", "65%", 0), value("tkl", "TKL", 5))),
                "CP-BR-PLT", 8, "Active", false
            )
        );
    }

    private static List<DomainModels.AdminOrderDetail> buildOrders(DomainModels.AuthUser defaultUser) {
        return List.of(
            new DomainModels.AdminOrderDetail(
                "TG-2048", defaultUser.id(), defaultUser.name(), defaultUser.email(), "2026-03-21", "Delivered", 588, 2, "Complete",
                address("49 Charoen Nakhon Rd", "Bangkok", "10600", "Thailand"), "Paid",
                List.of("Order placed", "Assembly completed", "Delivered"),
                List.of(
                    cartItem("TG-2048-1", "monolith-pro-tkl", "Monolith Pro TKL", ACRYLIC_IMAGE, "Monolith Pro TKL preview.", 520, 1, Map.of("Switch Variant", "Mistral Linear", "Bottom Weight", "Powder-coated stone")),
                    cartItem("TG-2048-2", "atelier-desk-mat", "Atelier Desk Mat", WORKSPACE_IMAGE, "Atelier Desk Mat preview.", 68, 1, Map.of("Colorway", "Ash"))
                ),
                List.of()
            ),
            new DomainModels.AdminOrderDetail(
                "TG-2084", "customer-studio-north", "Studio North", "ops@studionorth.co", "2026-03-28", "Processing", 420, 1, "Picking parts",
                address("231 Soi Ari 4", "Bangkok", "10400", "Thailand"), "Paid",
                List.of("Order placed", "Payment captured", "Picking parts"),
                List.of(cartItem("TG-2084-1", "tactile-core-65", "Tactile Core-65", DETAIL_IMAGE, "Tactile Core-65 preview.", 420, 1, Map.of("Switch Variant", "Obsidian Tactile", "Plate Material", "FR4"))),
                List.of("Ready to Ship", "Shipped", "Canceled")
            ),
            new DomainModels.AdminOrderDetail(
                "TG-2091", "customer-narin-p", "Narin P.", "narin@atelier.example", "2026-04-02", "Ready to Ship", 170, 2, "Packed and labeled",
                address("88 Sukhumvit 55", "Bangkok", "10110", "Thailand"), "Paid",
                List.of("Order placed", "Assembly completed", "Packed and labeled"),
                List.of(
                    cartItem("TG-2091-1", "quiet-grid-keycap-set", "Quiet Grid Keycap Set", KEYCAPS_IMAGE, "Quiet Grid Keycap Set preview.", 95, 1, Map.of("Legend Style", "Standard")),
                    cartItem("TG-2091-2", "atelier-desk-mat", "Atelier Desk Mat", WORKSPACE_IMAGE, "Atelier Desk Mat preview.", 75, 1, Map.of("Colorway", "Stone"))
                ),
                List.of("Shipped", "Canceled")
            ),
            new DomainModels.AdminOrderDetail(
                "TG-2098", "customer-quiet-works", "Quiet Works", "team@quietworks.dev", "2026-04-05", "Payment Review", 595, 3, "Awaiting payment confirmation",
                address("77 Wireless Rd", "Bangkok", "10330", "Thailand"), "Review",
                List.of("Order placed", "Payment flagged", "Awaiting review"),
                List.of(
                    cartItem("TG-2098-1", "monolith-pro-tkl", "Monolith Pro TKL", ACRYLIC_IMAGE, "Monolith Pro TKL preview.", 520, 1, Map.of("Switch Variant", "Mistral Linear", "Bottom Weight", "Powder-coated stone")),
                    cartItem("TG-2098-2", "obsidian-tactile-switch-pack", "Obsidian Tactile Switch Pack", SWITCHES_IMAGE, "Obsidian Tactile Switch Pack preview.", 58, 1, Map.of("Pack Size", "90 switches")),
                    cartItem("TG-2098-3", "brass-accent-plate", "Brass Accent Plate", EXPLODED_IMAGE, "Brass Accent Plate preview.", 17, 1, Map.of("Layout", "TKL"))
                ),
                List.of("Processing", "Canceled")
            )
        );
    }

    private static DomainModels.ImageAsset image(String src, String alt) {
        return new DomainModels.ImageAsset(src, alt);
    }

    private static DomainModels.SpecItem spec(String label, String value) {
        return new DomainModels.SpecItem(label, value);
    }

    private static DomainModels.ProductOptionValue value(String id, String label, double priceDelta) {
        return new DomainModels.ProductOptionValue(id, label, priceDelta);
    }

    private static DomainModels.ProductOption option(
        String id,
        String group,
        DomainModels.ProductOptionValue... values
    ) {
        return new DomainModels.ProductOption(id, group, List.of(values));
    }

    private static DomainModels.ShippingAddress address(
        String line1,
        String city,
        String postalCode,
        String country
    ) {
        return new DomainModels.ShippingAddress(line1, city, postalCode, country);
    }

    private static DomainModels.CartItem cartItem(
        String id,
        String productSlug,
        String productName,
        String imageSrc,
        String imageAlt,
        int price,
        int quantity,
        Map<String, String> selectedOptions
    ) {
        return new DomainModels.CartItem(
            id,
            productSlug,
            productName,
            image(imageSrc, imageAlt),
            price,
            quantity,
            selectedOptions
        );
    }
}
