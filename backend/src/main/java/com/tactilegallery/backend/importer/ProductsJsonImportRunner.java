package com.tactilegallery.backend.importer;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.persistence.entity.CategoryEntity;
import com.tactilegallery.backend.persistence.entity.ProductEntity;
import com.tactilegallery.backend.persistence.entity.ProductHighlightEntity;
import com.tactilegallery.backend.persistence.entity.ProductImageEntity;
import com.tactilegallery.backend.persistence.entity.ProductOptionEntity;
import com.tactilegallery.backend.persistence.entity.ProductOptionValueEntity;
import com.tactilegallery.backend.persistence.entity.ProductSpecEntity;
import com.tactilegallery.backend.persistence.entity.ProductTagEntity;
import com.tactilegallery.backend.persistence.repository.CategoryRepository;
import com.tactilegallery.backend.persistence.repository.ProductRepository;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "app.catalog-import", name = "enabled", havingValue = "true")
public class ProductsJsonImportRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ProductsJsonImportRunner.class);

    private static final List<String> NEGATIVE_TERMS = List.of(
        "one piece",
        "warhammer",
        "magic the gathering",
        "dragon shield",
        "booster",
        "display box",
        "magazine",
        "sleeves",
        "figurine",
        "trading card",
        "pokemon",
        "yugioh",
        "gundam",
        "amiibo",
        "mouse",
        "charger",
        "light bar",
        "gaming chair",
        "headset",
        "speaker",
        "plushie"
    );

    private static final List<String> KEYBOARD_TERMS = List.of(
        "keyboard",
        "barebones",
        "numpad",
        "macro pad",
        "macropad"
    );

    private static final List<String> ACCESSORY_TERMS = List.of(
        "keycap",
        "desk mat",
        "deskmat",
        "wrist rest",
        "cable",
        "artisan",
        "puller",
        "opener",
        "keyboard bag",
        "carrying case",
        "folio case",
        "palm rest",
        "accessory pack",
        "tray",
        "case"
    );

    private static final List<String> PART_TERMS = List.of(
        "switch",
        "stabilizer",
        "plate",
        "foam kit",
        "foam",
        "pcb",
        "knob"
    );

    private static final int MAX_GALLERY_IMAGES = 12;

    private final ObjectMapper objectMapper;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final Path sourcePath;
    private final boolean exitAfterRun;
    private final ConfigurableApplicationContext applicationContext;

    public ProductsJsonImportRunner(
        ObjectMapper objectMapper,
        CategoryRepository categoryRepository,
        ProductRepository productRepository,
        @Value("${app.catalog-import.path}") String sourcePath,
        @Value("${app.catalog-import.exit-after-run:false}") boolean exitAfterRun,
        ConfigurableApplicationContext applicationContext
    ) {
        this.objectMapper = objectMapper;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.sourcePath = Paths.get(sourcePath).toAbsolutePath().normalize();
        this.exitAfterRun = exitAfterRun;
        this.applicationContext = applicationContext;
    }

    @PostConstruct
    void verifySourceExists() {
        if (!Files.exists(sourcePath)) {
            throw new IllegalStateException("Catalog import source not found: " + sourcePath);
        }
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        List<SourceProduct> sourceProducts = loadProducts();
        Map<String, CategoryEntity> categories = loadCategories();
        Counters counters = new Counters();

        for (SourceProduct sourceProduct : sourceProducts) {
            String categorySlug = classifyCategory(sourceProduct);
            if (categorySlug == null || !hasAvailableVariant(sourceProduct)) {
                continue;
            }

            ProductEntity product = upsertProduct(sourceProduct, categories.get(categorySlug), counters);
            productRepository.save(product);
        }

        log.info(
            "Imported {} products from {} (created: {}, updated: {}).",
            counters.imported,
            sourcePath,
            counters.created,
            counters.updated
        );

        if (exitAfterRun) {
            log.info("Catalog import completed. Exiting application as requested.");
            SpringApplication.exit(applicationContext, () -> 0);
        }
    }

    private List<SourceProduct> loadProducts() throws IOException {
        return objectMapper.readValue(sourcePath.toFile(), new TypeReference<>() {
        });
    }

    private Map<String, CategoryEntity> loadCategories() {
        Map<String, CategoryEntity> categories = new LinkedHashMap<>();
        categoryRepository.findBySlug("keyboards").ifPresent(category -> categories.put("keyboards", category));
        categoryRepository.findBySlug("accessories").ifPresent(category -> categories.put("accessories", category));
        categoryRepository.findBySlug("custom-parts").ifPresent(category -> categories.put("custom-parts", category));
        return categories;
    }

    private ProductEntity upsertProduct(SourceProduct sourceProduct, CategoryEntity category, Counters counters) {
        String slug = extractSlug(sourceProduct);
        ProductEntity product = productRepository.findBySlug(slug).orElseGet(ProductEntity::new);
        boolean existing = product.getId() != null;
        LocalDateTime now = LocalDateTime.now();
        BigDecimal basePrice = determineBasePrice(sourceProduct);

        product.setSlug(slug);
        product.setCategory(category);
        product.setName(clip(sourceProduct.name(), 200));
        product.setSubtitle(clip(buildSubtitle(sourceProduct), 400));
        product.setDescription(clip(cleanDescription(sourceProduct.description()), 2000));
        product.setStory(clip(buildStory(sourceProduct), 3000));
        product.setMaterial(clip(extractMaterial(sourceProduct), 120));
        product.setPrice(basePrice);
        product.setImageSrc(primaryImage(sourceProduct, category));
        product.setImageAlt(clip(sourceProduct.name() + " product image", 255));
        product.setSku(clip(determineSku(slug), 120));
        product.setStock(determineStock(sourceProduct));
        product.setVisibility("Active");
        product.setArchived(false);
        product.setFeatured(false);
        product.setUpdatedAt(now);
        if (!existing) {
            product.setCreatedAt(now);
        }

        setTags(product, buildTags(sourceProduct, category.getSlug()));
        setImages(product, buildImages(sourceProduct));
        setHighlights(product, buildHighlights(sourceProduct));
        setSpecs(product, buildSpecs(sourceProduct));
        setOptions(product, buildOptions(sourceProduct, basePrice));

        counters.imported++;
        if (existing) {
            counters.updated++;
        } else {
            counters.created++;
        }
        return product;
    }

    private String classifyCategory(SourceProduct sourceProduct) {
        String name = normalize(sourceProduct.name());
        String description = normalize(sourceProduct.description());
        String blob = name + " " + description;

        if (containsAny(blob, NEGATIVE_TERMS)) {
            return null;
        }
        if (containsAny(name, KEYBOARD_TERMS)) {
            return "keyboards";
        }
        if (containsAny(name, ACCESSORY_TERMS)) {
            return "accessories";
        }
        if (containsAny(name, PART_TERMS)) {
            return "custom-parts";
        }
        if (containsAny(description, ACCESSORY_TERMS)) {
            return "accessories";
        }
        if (containsAny(description, PART_TERMS)) {
            return "custom-parts";
        }
        return null;
    }

    private boolean containsAny(String text, List<String> terms) {
        return terms.stream().anyMatch(text::contains);
    }

    private boolean hasAvailableVariant(SourceProduct sourceProduct) {
        return sourceProduct.variants().stream().anyMatch(SourceVariant::available);
    }

    private BigDecimal determineBasePrice(SourceProduct sourceProduct) {
        return sourceProduct.variants().stream()
            .filter(SourceVariant::available)
            .map(SourceVariant::price)
            .filter(this::isPositiveAmount)
            .map(BigDecimal::new)
            .min(BigDecimal::compareTo)
            .orElseGet(() -> new BigDecimal(sourceProduct.basePrice()).setScale(2, RoundingMode.HALF_UP));
    }

    private boolean isPositiveAmount(String value) {
        try {
            return new BigDecimal(value).compareTo(BigDecimal.ZERO) > 0;
        } catch (NumberFormatException exception) {
            return false;
        }
    }

    private String buildSubtitle(SourceProduct sourceProduct) {
        List<String> lines = descriptionLines(sourceProduct.description());
        return lines.isEmpty()
            ? "Imported mechanical keyboard catalog item."
            : lines.get(0);
    }

    private String buildStory(SourceProduct sourceProduct) {
        List<String> lines = descriptionLines(sourceProduct.description());
        if (lines.size() <= 1) {
            return cleanDescription(sourceProduct.description());
        }
        return String.join(" ", lines.subList(1, Math.min(lines.size(), 6)));
    }

    private String extractMaterial(SourceProduct sourceProduct) {
        String description = normalize(sourceProduct.description());
        if (description.contains("aluminum")) {
            return "Aluminum";
        }
        if (description.contains("pbt")) {
            return "PBT";
        }
        if (description.contains("brass")) {
            return "Brass";
        }
        if (description.contains("poron")) {
            return "Poron";
        }
        if (description.contains("pom")) {
            return "POM";
        }
        if (description.contains("plastic")) {
            return "Plastic";
        }
        return "Imported catalog item";
    }

    private String determineSku(String slug) {
        return "MKJSON-" + slug.toUpperCase(Locale.US);
    }

    private int determineStock(SourceProduct sourceProduct) {
        long availableVariantCount = sourceProduct.variants().stream().filter(SourceVariant::available).count();
        return (int) Math.max(availableVariantCount, 1);
    }

    private String primaryImage(SourceProduct sourceProduct, CategoryEntity category) {
        return sourceProduct.imageUrls().stream()
            .filter(value -> value != null && !value.isBlank())
            .findFirst()
            .orElse(category.getHeroImageSrc());
    }

    private List<String> buildTags(SourceProduct sourceProduct, String categorySlug) {
        LinkedHashSet<String> tags = new LinkedHashSet<>();
        tags.add("Imported");
        tags.add(firstWord(sourceProduct.name()));
        switch (categorySlug) {
            case "keyboards" -> tags.add("Keyboard");
            case "accessories" -> tags.add("Accessory");
            case "custom-parts" -> tags.add("Part");
            default -> {
            }
        }
        sourceProduct.options().keySet().stream()
            .limit(2)
            .forEach(tags::add);
        return tags.stream().filter(value -> value != null && !value.isBlank()).limit(5).toList();
    }

    private List<DomainModels.ImageAsset> buildImages(SourceProduct sourceProduct) {
        List<DomainModels.ImageAsset> images = new ArrayList<>();
        List<String> urls = sourceProduct.imageUrls();
        for (int index = 0; index < Math.min(urls.size(), MAX_GALLERY_IMAGES); index++) {
            String url = urls.get(index);
            if (url == null || url.isBlank()) {
                continue;
            }
            images.add(new DomainModels.ImageAsset(url, clip(sourceProduct.name() + " image " + (index + 1), 255)));
        }
        return images;
    }

    private List<String> buildHighlights(SourceProduct sourceProduct) {
        List<String> lines = descriptionLines(sourceProduct.description());
        if (lines.isEmpty()) {
            return List.of("Imported from products.json");
        }
        return lines.stream().limit(3).map(line -> clip(line, 255)).toList();
    }

    private List<DomainModels.SpecItem> buildSpecs(SourceProduct sourceProduct) {
        List<DomainModels.SpecItem> specs = new ArrayList<>();
        specs.add(new DomainModels.SpecItem("Brand", clip(firstWord(sourceProduct.name()), 120)));
        specs.add(new DomainModels.SpecItem("Base Price", "$" + normalizeMoney(sourceProduct.basePrice())));
        specs.add(new DomainModels.SpecItem(
            "Options",
            clip(sourceProduct.options().isEmpty() ? "Standard" : String.join(", ", sourceProduct.options().keySet()), 255)
        ));
        specs.add(new DomainModels.SpecItem(
            "Variants",
            String.valueOf(sourceProduct.variants().stream().filter(SourceVariant::available).count())
        ));
        specs.add(new DomainModels.SpecItem("Images", String.valueOf(sourceProduct.imageCount())));
        specs.add(new DomainModels.SpecItem("Source SKU", clip(primarySourceSku(sourceProduct), 255)));
        return specs;
    }

    private String primarySourceSku(SourceProduct sourceProduct) {
        return sourceProduct.variants().stream()
            .filter(SourceVariant::available)
            .map(SourceVariant::sku)
            .filter(value -> value != null && !value.isBlank())
            .findFirst()
            .orElse("n/a");
    }

    private List<DomainModels.ProductOption> buildOptions(SourceProduct sourceProduct, BigDecimal basePrice) {
        if (sourceProduct.options().isEmpty()) {
            return List.of();
        }

        List<String> groupNames = new ArrayList<>(sourceProduct.options().keySet());
        List<DomainModels.ProductOption> options = new ArrayList<>();

        for (int groupIndex = 0; groupIndex < groupNames.size(); groupIndex++) {
            String groupName = groupNames.get(groupIndex);
            List<String> values = sourceProduct.options().getOrDefault(groupName, List.of()).stream()
                .filter(value -> value != null && !value.isBlank() && !"Default Title".equalsIgnoreCase(value))
                .toList();
            if (values.isEmpty()) {
                continue;
            }

            List<DomainModels.ProductOptionValue> optionValues = new ArrayList<>();
            for (int valueIndex = 0; valueIndex < values.size(); valueIndex++) {
                String label = values.get(valueIndex);
                BigDecimal priceDelta = minimumPriceForValue(sourceProduct, groupIndex, label).subtract(basePrice);
                optionValues.add(new DomainModels.ProductOptionValue(
                    slugify(label),
                    label,
                    priceDelta.doubleValue()
                ));
            }

            options.add(new DomainModels.ProductOption(slugify(groupName), groupName, optionValues));
        }

        return options;
    }

    private BigDecimal minimumPriceForValue(SourceProduct sourceProduct, int groupIndex, String label) {
        return sourceProduct.variants().stream()
            .filter(SourceVariant::available)
            .filter(variant -> label.equals(optionByIndex(variant, groupIndex)))
            .map(SourceVariant::price)
            .filter(this::isPositiveAmount)
            .map(BigDecimal::new)
            .min(BigDecimal::compareTo)
            .orElseGet(() -> new BigDecimal(sourceProduct.basePrice()).setScale(2, RoundingMode.HALF_UP));
    }

    private String optionByIndex(SourceVariant variant, int groupIndex) {
        return switch (groupIndex) {
            case 0 -> variant.option1();
            case 1 -> variant.option2();
            case 2 -> variant.option3();
            default -> null;
        };
    }

    private String extractSlug(SourceProduct sourceProduct) {
        String productUrl = sourceProduct.productUrl();
        if (productUrl != null && !productUrl.isBlank()) {
            try {
                String path = URI.create(productUrl).getPath();
                String[] segments = path.split("/");
                for (int index = segments.length - 1; index >= 0; index--) {
                    if (!segments[index].isBlank()) {
                        return clip(segments[index], 160);
                    }
                }
            } catch (IllegalArgumentException ignored) {
            }
        }
        return clip(slugify(sourceProduct.name()), 160);
    }

    private String cleanDescription(String description) {
        return String.join(" ", descriptionLines(description));
    }

    private List<String> descriptionLines(String description) {
        String normalized = description == null ? "" : description.replace("\r", "\n");
        return normalized.lines()
            .map(String::trim)
            .filter(line -> !line.isBlank())
            .map(line -> line.replaceAll("\\s+", " "))
            .toList();
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.US);
    }

    private String firstWord(String value) {
        String trimmed = value == null ? "" : value.trim();
        int firstSpace = trimmed.indexOf(' ');
        return firstSpace < 0 ? trimmed : trimmed.substring(0, firstSpace);
    }

    private String normalizeMoney(String value) {
        try {
            return new BigDecimal(value).setScale(2, RoundingMode.HALF_UP).toPlainString();
        } catch (NumberFormatException exception) {
            return "0.00";
        }
    }

    private String slugify(String value) {
        return value == null
            ? ""
            : value.trim().toLowerCase(Locale.US).replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
    }

    private String clip(String value, int length) {
        if (value == null) {
            return "";
        }
        return value.length() <= length ? value : value.substring(0, length);
    }

    private void setTags(ProductEntity product, List<String> tags) {
        product.getTags().clear();
        for (String value : tags) {
            ProductTagEntity tag = new ProductTagEntity();
            tag.setProduct(product);
            tag.setTag(value);
            product.getTags().add(tag);
        }
    }

    private void setImages(ProductEntity product, List<DomainModels.ImageAsset> images) {
        product.getImages().clear();
        List<DomainModels.ImageAsset> source = images.isEmpty()
            ? List.of(new DomainModels.ImageAsset(product.getImageSrc(), product.getImageAlt()))
            : images;
        for (int index = 0; index < source.size(); index++) {
            DomainModels.ImageAsset image = source.get(index);
            ProductImageEntity entity = new ProductImageEntity();
            entity.setProduct(product);
            entity.setImageSrc(image.src());
            entity.setImageAlt(image.alt());
            entity.setSortOrder(index + 1);
            product.getImages().add(entity);
        }
    }

    private void setSpecs(ProductEntity product, List<DomainModels.SpecItem> specs) {
        product.getSpecs().clear();
        for (int index = 0; index < specs.size(); index++) {
            DomainModels.SpecItem spec = specs.get(index);
            ProductSpecEntity entity = new ProductSpecEntity();
            entity.setProduct(product);
            entity.setSpecLabel(spec.label());
            entity.setSpecValue(spec.value());
            entity.setSortOrder(index + 1);
            product.getSpecs().add(entity);
        }
    }

    private void setHighlights(ProductEntity product, List<String> highlights) {
        product.getHighlights().clear();
        for (int index = 0; index < highlights.size(); index++) {
            ProductHighlightEntity entity = new ProductHighlightEntity();
            entity.setProduct(product);
            entity.setHighlightText(highlights.get(index));
            entity.setSortOrder(index + 1);
            product.getHighlights().add(entity);
        }
    }

    private void setOptions(ProductEntity product, List<DomainModels.ProductOption> options) {
        product.getOptions().clear();
        for (int optionIndex = 0; optionIndex < options.size(); optionIndex++) {
            DomainModels.ProductOption option = options.get(optionIndex);
            ProductOptionEntity optionEntity = new ProductOptionEntity();
            optionEntity.setProduct(product);
            optionEntity.setOptionKey(option.id());
            optionEntity.setOptionGroupName(option.group());
            optionEntity.setSortOrder(optionIndex + 1);
            optionEntity.setValues(new ArrayList<>());

            for (int valueIndex = 0; valueIndex < option.values().size(); valueIndex++) {
                DomainModels.ProductOptionValue value = option.values().get(valueIndex);
                ProductOptionValueEntity valueEntity = new ProductOptionValueEntity();
                valueEntity.setProductOption(optionEntity);
                valueEntity.setOptionValueKey(value.id());
                valueEntity.setLabel(value.label());
                valueEntity.setPriceDelta(BigDecimal.valueOf(value.priceDelta()));
                valueEntity.setSortOrder(valueIndex + 1);
                optionEntity.getValues().add(valueEntity);
            }

            product.getOptions().add(optionEntity);
        }
    }

    private record SourceProduct(
        String name,
        String description,
        String productUrl,
        String basePrice,
        Map<String, List<String>> options,
        List<SourceVariant> variants,
        List<String> imageUrls,
        int imageCount
    ) {
        SourceProduct {
            options = options == null ? Map.of() : options;
            variants = variants == null ? List.of() : variants;
            imageUrls = imageUrls == null ? List.of() : imageUrls;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("product_url")
        public String productUrl() {
            return productUrl;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("base_price")
        public String basePrice() {
            return basePrice;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("image_urls")
        public List<String> imageUrls() {
            return imageUrls;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("image_count")
        public int imageCount() {
            return imageCount;
        }
    }

    private record SourceVariant(
        long variantId,
        String option1,
        String option2,
        String option3,
        String price,
        String comparePrice,
        String sku,
        boolean available,
        String imageUrl
    ) {
        @com.fasterxml.jackson.annotation.JsonProperty("variant_id")
        public long variantId() {
            return variantId;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("compare_price")
        public String comparePrice() {
            return comparePrice;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("image_url")
        public String imageUrl() {
            return imageUrl;
        }
    }

    private static final class Counters {
        private int imported;
        private int created;
        private int updated;
    }
}
