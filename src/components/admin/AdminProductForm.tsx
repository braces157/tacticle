import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { uploadAdminProductImage } from "../../services/adminApi";
import { Button } from "../ui/Button";
import { InputField } from "../ui/InputField";
import type {
  AdminDraftProduct,
  AdminDraftProductImage,
  AdminDraftProductOption,
  AdminDraftProductOptionValue,
  ProductDetail,
} from "../../types/domain";
import { formatCurrency } from "../../utils/currency";
import { shouldContainProductImage } from "../../utils/productMedia";

type AdminProductFormProps = {
  mode: "create" | "edit";
  initialValues: AdminDraftProduct;
  previewProduct?: ProductDetail | null;
  cancelHref?: string;
  onSubmit(values: AdminDraftProduct): Promise<string | void> | string | void;
};

type AdminProductFormState = Omit<AdminDraftProduct, "images" | "options"> & {
  images: AdminDraftProductImage[];
  options: AdminDraftProductOption[];
};

const optionPresets = [
  { group: "Color", values: ["Black", "White", "Blue"] },
  { group: "Switch", values: ["Red", "Brown", "Blue"] },
] as const;

function createDraftId(prefix: string) {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createOptionValue(label = "", priceDelta = ""): AdminDraftProductOptionValue {
  return {
    id: createDraftId("option-value"),
    label,
    priceDelta,
  };
}

function createImage(src = "", alt = ""): AdminDraftProductImage {
  return {
    id: createDraftId("image"),
    src,
    alt,
  };
}

function createOption(group = "", values?: string[]): AdminDraftProductOption {
  return {
    id: createDraftId("option"),
    group,
    values: values?.length ? values.map((value) => createOptionValue(value)) : [createOptionValue()],
  };
}

function optionHasContent(option: AdminDraftProductOption) {
  return (
    option.group.trim().length > 0 ||
    option.values.some((value) => value.label.trim().length > 0 || value.priceDelta.trim().length > 0)
  );
}

function normalizeOptions(options?: AdminDraftProductOption[]) {
  return (options ?? [])
    .map((option) => ({
      ...option,
      id: option.id || createDraftId("option"),
      group: option.group.trim(),
      values: option.values
        .map((value) => ({
          ...value,
          id: value.id || createDraftId("option-value"),
          label: value.label.trim(),
          priceDelta: value.priceDelta.trim(),
        }))
        .filter((value) => value.label || value.priceDelta),
    }))
    .filter((option) => option.group || option.values.length);
}

function imageHasContent(image: AdminDraftProductImage) {
  return image.src.trim().length > 0 || image.alt.trim().length > 0;
}

function normalizeImages(images?: AdminDraftProductImage[]) {
  return (images ?? [])
    .map((image) => ({
      ...image,
      id: image.id || createDraftId("image"),
      src: image.src.trim(),
      alt: image.alt.trim(),
    }))
    .filter(imageHasContent);
}

function describeOption(option: AdminDraftProductOption) {
  return option.values
    .filter((value) => value.label.trim())
    .map((value) => {
      if (!value.priceDelta.trim() || Number(value.priceDelta) === 0) {
        return value.label.trim();
      }

      return `${value.label.trim()} (+${formatCurrency(Number(value.priceDelta))})`;
    })
    .join(" / ");
}

function removeExtension(filename: string) {
  const index = filename.lastIndexOf(".");
  return index > 0 ? filename.slice(0, index) : filename;
}

function mapPreviewImages(previewProduct?: ProductDetail | null): AdminDraftProductImage[] {
  if (!previewProduct) {
    return [createImage()];
  }

  const source = previewProduct.gallery.length
    ? previewProduct.gallery
    : [previewProduct.image];

  return source.map((image, index) => ({
    id: `preview-image-${index + 1}`,
    src: image.src,
    alt: image.alt,
  }));
}

function normalizeFormValues(
  values: AdminDraftProduct,
  previewProduct?: ProductDetail | null,
): AdminProductFormState {
  return {
    ...values,
    images: values.images?.length ? values.images : mapPreviewImages(previewProduct),
    options: values.options ?? [],
  };
}

export function AdminProductForm({
  mode,
  initialValues,
  previewProduct,
  cancelHref = "/admin/inventory",
  onSubmit,
}: AdminProductFormProps) {
  const [values, setValues] = useState<AdminProductFormState>(() =>
    normalizeFormValues(initialValues, previewProduct),
  );
  const [openSections, setOpenSections] = useState({
    gallery: true,
    options: false,
    metadata: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof AdminDraftProduct, string>>>({});
  const [savedMessage, setSavedMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState("");

  useEffect(() => {
    setValues(normalizeFormValues(initialValues, previewProduct));
    setErrors({});
    setSavedMessage("");
    setImageUploadError("");
  }, [initialValues, previewProduct]);

  function update<K extends keyof AdminProductFormState>(key: K, value: AdminProductFormState[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSavedMessage("");
  }

  function toggleSection(section: keyof typeof openSections) {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  }

  function updateOption(optionId: string, updater: (option: AdminDraftProductOption) => AdminDraftProductOption) {
    update(
      "options",
      values.options.map((option) => (option.id === optionId ? updater(option) : option)),
    );
  }

  function updateImage(imageId: string, updater: (image: AdminDraftProductImage) => AdminDraftProductImage) {
    update(
      "images",
      values.images.map((image) => (image.id === imageId ? updater(image) : image)),
    );
  }

  function addImage() {
    update("images", [...values.images, createImage()]);
  }

  function removeImage(imageId: string) {
    const nextImages = values.images.filter((image) => image.id !== imageId);
    update("images", nextImages.length ? nextImages : [createImage()]);
  }

  async function handleImageUpload(imageId: string, file: File | null) {
    if (!file) {
      return;
    }

    setImageUploadError("");
    setUploadingImageId(imageId);

    try {
      const uploaded = await uploadAdminProductImage(file);
      updateImage(imageId, (current) => ({
        ...current,
        src: uploaded.url,
        alt: current.alt.trim() || removeExtension(file.name).replace(/[-_]+/g, " ").trim(),
      }));
    } catch (error) {
      setImageUploadError(
        error instanceof Error ? error.message : "Unable to upload this image right now.",
      );
    } finally {
      setUploadingImageId(null);
    }
  }

  function addOption(group = "", presetValues?: string[]) {
    update("options", [...values.options, createOption(group, presetValues)]);
  }

  function removeOption(optionId: string) {
    update(
      "options",
      values.options.filter((option) => option.id !== optionId),
    );
  }

  function addOptionValue(optionId: string, label = "") {
    updateOption(optionId, (option) => ({
      ...option,
      values: [...option.values, createOptionValue(label)],
    }));
  }

  function updateOptionValue(
    optionId: string,
    valueId: string,
    key: keyof AdminDraftProductOptionValue,
    nextValue: string,
  ) {
    updateOption(optionId, (option) => ({
      ...option,
      values: option.values.map((value) => (
        value.id === valueId ? { ...value, [key]: nextValue } : value
      )),
    }));
  }

  function removeOptionValue(optionId: string, valueId: string) {
    updateOption(optionId, (option) => ({
      ...option,
      values: option.values.filter((value) => value.id !== valueId),
    }));
  }

  function applyPreset(group: string, presetValues: readonly string[]) {
    const existingOption = values.options.find(
      (option) => option.group.trim().toLowerCase() === group.toLowerCase(),
    );
    if (!existingOption) {
      addOption(group, [...presetValues]);
      return;
    }

    const knownLabels = new Set(
      existingOption.values.map((value) => value.label.trim().toLowerCase()).filter(Boolean),
    );
    const missingValues = presetValues.filter((value) => !knownLabels.has(value.toLowerCase()));
    if (!missingValues.length) {
      return;
    }

    updateOption(existingOption.id, (option) => ({
      ...option,
      values: [...option.values, ...missingValues.map((value) => createOptionValue(value))],
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Partial<Record<keyof AdminDraftProduct, string>> = {};
    const normalizedOptions = normalizeOptions(values.options);
    const normalizedImages = normalizeImages(values.images);

    if (!values.name.trim()) nextErrors.name = "Product name is required.";
    if (!values.category.trim()) nextErrors.category = "Category is required.";
    if (!values.sku.trim()) nextErrors.sku = "SKU is required.";
    if (!values.price.trim()) {
      nextErrors.price = "Price is required.";
    } else if (Number.isNaN(Number(values.price)) || Number(values.price) <= 0) {
      nextErrors.price = "Enter a valid price greater than 0.";
    }
    if (!values.stock.trim()) {
      nextErrors.stock = "Stock is required.";
    } else if (Number.isNaN(Number(values.stock)) || Number(values.stock) < 0) {
      nextErrors.stock = "Enter a valid stock quantity.";
    }
    if (!values.description.trim()) {
      nextErrors.description = "Description is required.";
    }
    if (!normalizedImages.length) {
      nextErrors.images = "Add at least one product image.";
    } else if (normalizedImages.some((image) => !image.src || !image.alt)) {
      nextErrors.images = "Each product image needs both an image URL and alt text.";
    }

    for (const option of normalizedOptions) {
      if (!option.group) {
        nextErrors.options = "Each option group needs a name, such as Color or Switch.";
        break;
      }

      if (!option.values.length) {
        nextErrors.options = "Each option group needs at least one value.";
        break;
      }

      if (option.values.some((value) => !value.label)) {
        nextErrors.options = "Each option value needs a label.";
        break;
      }

      if (option.values.some((value) => value.priceDelta && Number.isNaN(Number(value.priceDelta)))) {
        nextErrors.options = "Price adjustments must be valid numbers.";
        break;
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setValues((current) => ({
        ...current,
        images: normalizedImages.length ? normalizedImages : current.images,
        options: normalizedOptions,
      }));
      return;
    }

    const nextValues: AdminDraftProduct = {
      ...values,
      images: normalizedImages,
      options: normalizedOptions.map((option) => ({
        ...option,
        values: option.values.map((value) => ({
          ...value,
          priceDelta: value.priceDelta || "0",
        })),
      })),
    };

    setValues(nextValues);
    setSubmitting(true);
    const message = await onSubmit(nextValues);
    setSubmitting(false);
    if (message) {
      setSavedMessage(message);
    }
  }

  const useContainedImage = shouldContainProductImage(previewProduct?.tags ?? []);
  const draftImages = normalizeImages(values.images);
  const previewImages = draftImages.length
    ? draftImages.map((image) => ({ src: image.src, alt: image.alt }))
    : (previewProduct?.gallery ?? []);
  const previewSpecs = (previewProduct?.specs ?? []).slice(0, 6);
  const visibleOptions = values.options.filter(optionHasContent);

  return (
    <form className="space-y-10" onSubmit={handleSubmit}>
      <div className="grid gap-8 lg:grid-cols-[0.42fr_0.58fr]">
        <div className="space-y-5">
          <div className="poster-frame aspect-square rounded-[1.5rem]">
            <img
              src={previewImages[0]?.src ?? previewProduct?.image.src ?? "https://lh3.googleusercontent.com/aida-public/AB6AXuAb1gL_k2Ql93MFpyGKczf39692KVEo9vA2lBMttaG0P0rE9qXNspqn8Cqqs3OV1pQPtQR1F--GMV0zEI4rNWmprFZxZ6PFvM1wgeKcsmHGVQaOSaj2_gudXiTKn4zLby-AvIgMv-oNHO4H2spdeITE3vnyXUvuGryNZ5YG_uqWoR65guhikLAogx-mg9diKMXp1arHfCUUPn5RnRMNf5wdKuIGTQ_8sFrchkNRQ7PpoLo3BKcKV3qbwWjzWlDXnYewieA35Mrm4mc"}
              alt={previewImages[0]?.alt ?? previewProduct?.image.alt ?? "Product preview"}
              className={[
                "h-full w-full bg-[var(--color-surface-low)]",
                useContainedImage ? "object-contain p-5" : "object-cover",
              ].join(" ")}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {previewImages.slice(1, 7).map((image) => (
              <div key={image.src} className="overflow-hidden rounded-xl bg-[var(--color-surface-low)]">
                <img
                  src={image.src}
                  alt={image.alt}
                  className={[
                    "aspect-square h-full w-full bg-[var(--color-surface-low)]",
                    useContainedImage ? "object-contain p-3" : "object-cover",
                  ].join(" ")}
                />
              </div>
            ))}
            {!previewImages.length ? (
              <div className="flex aspect-square items-center justify-center rounded-xl bg-[var(--color-surface-high)] text-sm font-semibold text-[var(--color-muted)]">
                No image
              </div>
            ) : null}
          </div>

          {previewProduct ? (
            <div className="rounded-[1.25rem] bg-[var(--color-surface-low)] p-5">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                Product Snapshot
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-white px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">Store Price</p>
                  <p className="mt-2 font-['Manrope'] text-lg font-bold">{formatCurrency(previewProduct.price)}</p>
                </div>
                <div className="rounded-xl bg-white px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">Media</p>
                  <p className="mt-2 font-['Manrope'] text-lg font-bold">{previewImages.length} images</p>
                </div>
                <div className="rounded-xl bg-white px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">Option Groups</p>
                  <p className="mt-2 font-['Manrope'] text-lg font-bold">{visibleOptions.length}</p>
                </div>
                <div className="rounded-xl bg-white px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">Material</p>
                  <p className="mt-2 font-['Manrope'] text-lg font-bold">{previewProduct.material}</p>
                </div>
              </div>
            </div>
          ) : null}

          {visibleOptions.length ? (
            <div className="rounded-[1.25rem] bg-[var(--color-surface-low)] p-5">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                Storefront Options
              </p>
              <div className="mt-4 space-y-4">
                {visibleOptions.map((option) => (
                  <div key={option.id}>
                    <p className="text-sm font-semibold text-[var(--color-on-surface)]">{option.group || "Untitled"}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                      {describeOption(option) || "No values yet"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <section className="rounded-[1.5rem] border border-[rgba(173,179,180,0.18)] bg-white p-6 shadow-[0_20px_60px_rgba(17,24,28,0.05)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                  Core Details
                </p>
                <h3 className="mt-3 font-['Manrope'] text-2xl font-extrabold tracking-[-0.04em]">
                  Essentials first
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">
                  Keep the core catalog information here. Media, options, and specs live in their own sections below.
                </p>
              </div>
              <div className="grid min-w-[14rem] gap-2 rounded-2xl bg-[var(--color-surface-low)] p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--color-muted)]">Images</span>
                  <span className="font-semibold text-[var(--color-on-surface)]">{Math.max(values.images.length, draftImages.length)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--color-muted)]">Option groups</span>
                  <span className="font-semibold text-[var(--color-on-surface)]">{values.options.length}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--color-muted)]">Visibility</span>
                  <span className="font-semibold text-[var(--color-on-surface)]">{values.status}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <InputField
                label="Product Name"
                value={values.name}
                onChange={(event) => update("name", event.target.value)}
                error={errors.name}
              />
              <InputField
                label="SKU"
                value={values.sku}
                onChange={(event) => update("sku", event.target.value)}
                error={errors.sku}
              />
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <label className="flex flex-col gap-2">
                <span className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                  Category
                </span>
                <span className="input-shell flex">
                  <select
                    value={values.category}
                    onChange={(event) => update("category", event.target.value)}
                    className="w-full bg-transparent px-4 py-3 outline-none"
                  >
                    <option>Keyboards</option>
                    <option>Accessories</option>
                    <option>Custom Parts</option>
                  </select>
                </span>
                {errors.category ? (
                  <span className="text-sm text-[var(--color-error)]">{errors.category}</span>
                ) : null}
              </label>
              <InputField
                label="Price (USD)"
                type="number"
                min="0"
                step="0.01"
                value={values.price}
                onChange={(event) => update("price", event.target.value)}
                error={errors.price}
              />
              <InputField
                label="Stock Quantity"
                type="number"
                min="0"
                step="1"
                value={values.stock}
                onChange={(event) => update("stock", event.target.value)}
                error={errors.stock}
              />
            </div>

            <div className="mt-6">
              <InputField
                as="textarea"
                label="Product Description"
                value={values.description}
                onChange={(event) => update("description", event.target.value)}
                error={errors.description}
                hint="This is the main storefront copy customers will read."
              />
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-[rgba(173,179,180,0.18)] bg-[var(--color-surface-low)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-xl">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                  Product Gallery
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  Keep media separate from copy. Use upload or paste direct links, and the first image stays primary.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  {Math.max(values.images.length, draftImages.length)} images
                </span>
                <Button type="button" variant="tertiary" onClick={() => toggleSection("gallery")}>
                  {openSections.gallery ? "Collapse" : "Expand"}
                </Button>
                <Button type="button" variant="tertiary" onClick={addImage}>
                  Add Image
                </Button>
              </div>
            </div>

            {openSections.gallery ? (
              <>
                {errors.images ? (
                  <p className="mt-4 text-sm text-[var(--color-error)]">{errors.images}</p>
                ) : null}
                {imageUploadError ? (
                  <p className="mt-4 text-sm text-[var(--color-error)]">{imageUploadError}</p>
                ) : null}

                <div className="mt-5 space-y-4">
                  {values.images.map((image, index) => (
                    <div
                      key={image.id}
                      className="rounded-2xl bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                          {index === 0 ? "Primary Image" : `Gallery Image ${index + 1}`}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <label className="button-base button-tertiary cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) => {
                                const file = event.target.files?.[0] ?? null;
                                void handleImageUpload(image.id, file);
                                event.currentTarget.value = "";
                              }}
                            />
                            {uploadingImageId === image.id ? "Uploading…" : "Upload File"}
                          </label>
                          <Button
                            type="button"
                            variant="tertiary"
                            onClick={() => removeImage(image.id)}
                            disabled={values.images.length === 1}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
                        <div className="grid gap-4">
                          <InputField
                            label="Image URL"
                            value={image.src}
                            onChange={(event) =>
                              updateImage(image.id, (current) => ({
                                ...current,
                                src: event.target.value,
                              }))
                            }
                            hint="Use a direct image URL if you are not uploading."
                          />
                          <InputField
                            label="Alt Text"
                            value={image.alt}
                            onChange={(event) =>
                              updateImage(image.id, (current) => ({
                                ...current,
                                alt: event.target.value,
                              }))
                            }
                            hint="Describe what this angle shows."
                          />
                        </div>
                        <div className="overflow-hidden rounded-2xl bg-[var(--color-surface-low)]">
                          {image.src.trim() ? (
                            <img
                              src={image.src}
                              alt={image.alt || `Preview ${index + 1}`}
                              className="aspect-[4/3] h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex aspect-[4/3] items-center justify-center px-4 text-center text-sm font-medium text-[var(--color-muted)]">
                              Upload a file or paste an image URL to preview this slot.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </section>

          <section className="rounded-[1.5rem] border border-[rgba(173,179,180,0.18)] bg-[var(--color-surface-low)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-xl">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                  Product Options
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  Keep variant setup here only when the product really needs it.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  {values.options.length} groups
                </span>
                <Button type="button" variant="tertiary" onClick={() => toggleSection("options")}>
                  {openSections.options ? "Collapse" : "Expand"}
                </Button>
              </div>
            </div>

            {openSections.options ? (
              <>
                <div className="mt-5 flex flex-wrap gap-2">
                  {optionPresets.map((preset) => (
                    <Button
                      key={preset.group}
                      type="button"
                      variant="tertiary"
                      onClick={() => applyPreset(preset.group, preset.values)}
                    >
                      Add {preset.group}
                    </Button>
                  ))}
                  <Button type="button" variant="tertiary" onClick={() => addOption()}>
                    New Group
                  </Button>
                </div>

                {errors.options ? (
                  <p className="mt-4 text-sm text-[var(--color-error)]">{errors.options}</p>
                ) : null}

                <div className="mt-5 space-y-4">
                  {values.options.length ? values.options.map((option, optionIndex) => (
                    <div key={option.id} className="rounded-2xl bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                          Option Group {optionIndex + 1}
                        </p>
                        <Button
                          type="button"
                          variant="tertiary"
                          onClick={() => removeOption(option.id)}
                        >
                          Remove Group
                        </Button>
                      </div>

                      <div className="mt-4">
                        <InputField
                          label="Group Name"
                          value={option.group}
                          onChange={(event) => updateOption(option.id, (current) => ({
                            ...current,
                            group: event.target.value,
                          }))}
                          hint="Examples: Color, Switch, Layout, Size"
                        />
                      </div>

                      <div className="mt-4 space-y-3">
                        {option.values.map((value, valueIndex) => (
                          <div
                            key={value.id}
                            className="grid gap-3 rounded-xl border border-[rgba(173,179,180,0.22)] p-3 md:grid-cols-[minmax(0,1fr)_11rem_auto]"
                          >
                            <InputField
                              label={`Value ${valueIndex + 1}`}
                              value={value.label}
                              onChange={(event) =>
                                updateOptionValue(option.id, value.id, "label", event.target.value)
                              }
                              hint="Examples: Black, Blue, Brown switch"
                            />
                            <InputField
                              label="Price Delta"
                              type="number"
                              step="0.01"
                              value={value.priceDelta}
                              onChange={(event) =>
                                updateOptionValue(option.id, value.id, "priceDelta", event.target.value)
                              }
                              hint="Leave blank for no extra cost"
                            />
                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="tertiary"
                                className="w-full"
                                onClick={() => removeOptionValue(option.id, value.id)}
                                disabled={option.values.length === 1}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4">
                        <Button type="button" variant="secondary" onClick={() => addOptionValue(option.id)}>
                          Add Value
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-[rgba(173,179,180,0.28)] bg-white px-5 py-6 text-sm leading-7 text-[var(--color-muted)]">
                      No option groups yet. Start with <strong>Color</strong>, <strong>Switch</strong>, or create a
                      custom group for this product.
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </section>

          <section className="rounded-[1.5rem] border border-[rgba(173,179,180,0.18)] bg-[var(--color-surface-low)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-xl">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                  Metadata
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  Reserve this for structured specs like brand, profile, mount, or material.
                </p>
              </div>
              <Button type="button" variant="tertiary" onClick={() => toggleSection("metadata")}>
                {openSections.metadata ? "Collapse" : "Expand"}
              </Button>
            </div>

            {openSections.metadata ? (
              <div className="mt-5 space-y-5">
                <InputField
                  as="textarea"
                  label="Metadata"
                  value={values.metadata}
                  onChange={(event) => update("metadata", event.target.value)}
                  hint="One item per line. Use `Label: Value`, for example `Brand: Leopold`."
                />

                {previewSpecs.length ? (
                  <div className="rounded-[1.25rem] bg-white p-5">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                      Current Spec Snapshot
                    </p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {previewSpecs.map((spec) => (
                        <div key={`${spec.label}-${spec.value}`} className="rounded-xl bg-[var(--color-surface-low)] px-4 py-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">{spec.label}</p>
                          <p className="mt-2 text-sm leading-6 text-[var(--color-on-surface)]">{spec.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>
      </div>

      <div className="grid gap-6 rounded-[1.25rem] bg-[var(--color-surface-low)] p-6 lg:grid-cols-[0.35fr_0.65fr]">
        <div>
          <h3 className="font-['Manrope'] text-lg font-bold tracking-[-0.03em]">
            Publishing Status
          </h3>
          <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
            Control whether this item is active in the gallery or held back for
            revision.
          </p>
        </div>
        <div className="rounded-xl bg-white px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Public Listing</p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                {values.status === "Active" ? "Visible to customers" : "Hidden from storefront"}
              </p>
            </div>
            <div className="flex rounded-lg bg-[var(--color-surface-high)] p-1">
              {(["Active", "Hidden"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => update("status", status)}
                  className={[
                    "min-w-[7.5rem] rounded-md px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] transition",
                    values.status === status
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
                      : "text-[var(--color-muted)]",
                  ].join(" ")}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-4 border-t border-[rgba(173,179,180,0.12)] pt-8">
        <Link to={cancelHref}>
          <Button variant="tertiary" type="button">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={submitting}>
          {submitting
            ? mode === "create"
              ? "Creating…"
              : "Saving…"
            : mode === "create"
              ? "Create product"
              : "Save changes"}
        </Button>
      </div>

      {savedMessage ? (
        <p className="text-sm text-[var(--color-muted)]">
          {savedMessage}
        </p>
      ) : null}
    </form>
  );
}
