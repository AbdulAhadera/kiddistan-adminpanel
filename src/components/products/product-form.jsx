"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  DollarSign,
  ImageIcon,
  Layers,
  Package,
  Plus,
  Ruler,
  Upload,
  X,
} from "lucide-react";

import {
  createProduct,
  updateProduct,
} from "@/app/admin/(panel)/products/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatPKR, slugify } from "@/lib/utils";

function getInitialForm(product) {
  return {
    name: product?.name ?? "",
    categoryId: product?.category_id ?? "",
    status: product?.status ?? "draft",
    price: product?.price?.toString() ?? "",
    compareAtPrice: product?.compare_at_price?.toString() ?? "",
    description: product?.description ?? "",
    productType: product?.product_type ?? "",
    fabric: product?.attr_fabric ?? "",
    occasion: product?.attr_occasion ?? "",
    fit: product?.attr_fit ?? "",
  };
}

function toExistingImage(image) {
  return {
    id: image.id,
    previewUrl: image.image_url,
    existingUrl: image.image_url,
  };
}

export function ProductForm({
  product = null,
  categories = [],
  sizes = [],
  collections = [],
  selectedCollectionIds: initialSelectedCollectionIds = [],
}) {
  const router = useRouter();
  const primaryInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const existingImages = product?.product_images ?? [];

  const existingPrimaryImage =
    existingImages.find((image) => image.is_primary) ??
    (product?.primary_image
      ? {
          id: "legacy-primary-image",
          image_url: product.primary_image,
          is_primary: true,
        }
      : null);

  const [form, setForm] = useState(() => getInitialForm(product));

  const [primaryImage, setPrimaryImage] = useState(() =>
    existingPrimaryImage ? toExistingImage(existingPrimaryImage) : null
  );

  const [galleryImages, setGalleryImages] = useState(() =>
    existingImages
      .filter(
        (image) =>
          !image.is_primary &&
          image.image_url !== existingPrimaryImage?.image_url
      )
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
      .map(toExistingImage)
  );

  const [selectedSizes, setSelectedSizes] = useState(() =>
    (product?.product_sizes ?? []).map((item) => ({
      sizeId: item.size_id,
      stockQty: item.stock_qty ?? 0,
    }))
  );

  const [selectedCollectionIds, setSelectedCollectionIds] = useState(
    initialSelectedCollectionIds
  );

  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDetails, setShowDetails] = useState(
    Boolean(
      product?.description ||
        product?.product_type ||
        product?.attr_fabric ||
        product?.attr_occasion ||
        product?.attr_fit
    )
  );

  const isEditing = Boolean(product?.id);

  const categoryOptions = useMemo(() => {
    const parents = categories
      .filter((category) => !category.parent_id)
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order));

    return parents.flatMap((parent) => {
      const children = categories
        .filter((category) => category.parent_id === parent.id)
        .sort((a, b) => Number(a.sort_order) - Number(b.sort_order));

      return [
        { id: parent.id, label: parent.name },
        ...children.map((child) => ({
          id: child.id,
          label: `— ${child.name}`,
        })),
      ];
    });
  }, [categories]);

  const generatedSlug = useMemo(
    () => slugify(form.name) || "your-product-url",
    [form.name]
  );

  const price = Number(form.price || 0);
  const compareAtPrice = Number(form.compareAtPrice || 0);

  const discountPercent =
    compareAtPrice > price && price > 0
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : 0;

  const totalStock = selectedSizes.reduce(
    (total, item) => total + Number(item.stockQty || 0),
    0
  );

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function validateFiles(files) {
    const invalidFile = files.find(
      (file) => !file.type.startsWith("image/")
    );

    if (invalidFile) {
      setError("Please select image files only.");
      return false;
    }

    const oversizedFile = files.find(
      (file) => file.size > 8 * 1024 * 1024
    );

    if (oversizedFile) {
      setError("Each image must be 8 MB or smaller.");
      return false;
    }

    return true;
  }

  function selectPrimaryImage(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!validateFiles([file])) {
      event.target.value = "";
      return;
    }

    if (primaryImage?.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(primaryImage.previewUrl);
    }

    setError("");
    setPrimaryImage(makeLocalImage(file));
    event.target.value = "";
  }

  function addGalleryImages(event) {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    if (!validateFiles(files)) {
      event.target.value = "";
      return;
    }

    setError("");

    setGalleryImages((current) => [
      ...current,
      ...files.map((file) => makeLocalImage(file)),
    ]);

    event.target.value = "";
  }

  function removePrimaryImage() {
    if (primaryImage?.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(primaryImage.previewUrl);
    }

    setPrimaryImage(null);
  }

  function removeGalleryImage(imageId) {
    setGalleryImages((current) => {
      const image = current.find((item) => item.id === imageId);

      if (image?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(image.previewUrl);
      }

      return current.filter((item) => item.id !== imageId);
    });
  }

  function promoteGalleryImage(imageId) {
    const selectedGalleryImage = galleryImages.find(
      (image) => image.id === imageId
    );

    if (!selectedGalleryImage) {
      return;
    }

    setGalleryImages((current) => {
      const remainingImages = current.filter((image) => image.id !== imageId);

      return primaryImage ? [...remainingImages, primaryImage] : remainingImages;
    });

    setPrimaryImage(selectedGalleryImage);
  }

  function toggleSize(sizeId) {
    setSelectedSizes((current) => {
      const selected = current.find((item) => item.sizeId === sizeId);

      if (selected) {
        return current.filter((item) => item.sizeId !== sizeId);
      }

      return [...current, { sizeId, stockQty: 0 }];
    });
  }

  function updateSizeStock(sizeId, value) {
    if (value === "") {
      setSelectedSizes((current) =>
        current.map((item) =>
          item.sizeId === sizeId ? { ...item, stockQty: "" } : item
        )
      );
      return;
    }

    const stockQty = Math.max(0, Number.parseInt(value, 10) || 0);

    setSelectedSizes((current) =>
      current.map((item) =>
        item.sizeId === sizeId ? { ...item, stockQty } : item
      )
    );
  }

  function handleSizeStockFocus(sizeId) {
    setSelectedSizes((current) =>
      current.map((item) =>
        item.sizeId === sizeId && Number(item.stockQty) === 0
          ? { ...item, stockQty: "" }
          : item
      )
    );
  }

  function handleSizeStockBlur(sizeId) {
    setSelectedSizes((current) =>
      current.map((item) =>
        item.sizeId === sizeId && item.stockQty === ""
          ? { ...item, stockQty: 0 }
          : item
      )
    );
  }

  function addCollection(collectionId) {
    if (!collectionId) {
      return;
    }

    setSelectedCollectionIds((current) =>
      current.includes(collectionId)
        ? current
        : [...current, collectionId]
    );
  }

  function removeCollection(collectionId) {
    setSelectedCollectionIds((current) =>
      current.filter((id) => id !== collectionId)
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!primaryImage) {
      setError("Please select a primary product image.");
      return;
    }

    if (!form.name.trim()) {
      setError("Please enter a product name.");
      return;
    }

    if (!form.categoryId) {
      setError("Please select a category.");
      return;
    }

    if (!form.price || Number(form.price) <= 0) {
      setError("Please enter a valid selling price.");
      return;
    }

    if (
      form.compareAtPrice &&
      Number(form.compareAtPrice) > 0 &&
      Number(form.compareAtPrice) < Number(form.price)
    ) {
      setError("Old price must be higher than selling price.");
      return;
    }

    if (!selectedSizes.length) {
      setError("Please select at least one size.");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const imagesToSave = [primaryImage, ...galleryImages];

      const imageUrls = await Promise.all(
        imagesToSave.map((image) => {
          if (image.existingUrl) {
            return Promise.resolve(image.existingUrl);
          }

          if (!image.file) {
            throw new Error("One selected image is missing its file.");
          }

          return uploadImageToCloudinary(image.file);
        })
      );

      const payload = {
        ...form,
        images: imageUrls,
        sizes: selectedSizes.map((item) => ({
          sizeId: item.sizeId,
          stockQty: item.stockQty === "" ? 0 : item.stockQty,
        })),
        collectionIds: selectedCollectionIds,
      };

      const result = isEditing
        ? await updateProduct(product.id, payload)
        : await createProduct(payload);

      if (!result.ok) {
        setError(result.message || "Product could not be saved.");
        return;
      }

      router.push(`/admin/products/${result.productId}`);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Product could not be saved. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-auto pb-8">
      {error ? (
        <div
          role="alert"
          className="mb-3 rounded-sm border border-destructive/25 bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3">
          <section className="card-surface p-4 shadow-soft">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ImageIcon className="h-4 w-4" />
              </span>

              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Product photos
                </h2>

                <p className="text-xs text-muted-foreground">
                  Images upload only when you save the product.
                </p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div>
                <Label className="mb-1.5 block">Primary image *</Label>

                {primaryImage ? (
                  <div className="group relative aspect-square overflow-hidden rounded-sm border border-primary bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={primaryImage.previewUrl}
                      alt="Primary product preview"
                      className="h-full w-full object-cover"
                    />

                    <span className="absolute bottom-2 left-2 rounded-sm bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground">
                      Primary image
                    </span>

                    <div className="absolute inset-x-2 top-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => primaryInputRef.current?.click()}
                        disabled={isSaving}
                        className="rounded-sm bg-background/90 px-2 py-1 text-xs font-medium text-foreground shadow-sm hover:bg-background"
                      >
                        Replace
                      </button>

                      <button
                        type="button"
                        onClick={removePrimaryImage}
                        disabled={isSaving}
                        aria-label="Remove primary image"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-sm bg-background/90 text-muted-foreground shadow-sm hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => primaryInputRef.current?.click()}
                    disabled={isSaving}
                    className="flex aspect-square w-full flex-col items-center justify-center rounded-sm border-2 border-dashed border-primary/35 bg-primary/5 px-4 text-center transition-colors hover:border-primary hover:bg-primary/10"
                  >
                    <ImageIcon className="h-7 w-7 text-primary" />
                    <span className="mt-2 text-sm font-semibold text-foreground">
                      Upload primary image
                    </span>
                    <span className="mt-0.5 text-xs leading-5 text-muted-foreground">
                      Main photo shown in store listings
                    </span>
                  </button>
                )}

                <input
                  ref={primaryInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={selectPrimaryImage}
                  disabled={isSaving}
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <Label>More images</Label>

                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add more photos
                  </button>
                </div>

                {galleryImages.length ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={isSaving}
                      className="flex aspect-square flex-col items-center justify-center rounded-sm border border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                    >
                      <Plus className="h-5 w-5" />
                      <span className="mt-1 text-xs">Add photos</span>
                    </button>

                    {galleryImages.map((image, index) => (
                      <div
                        key={image.id}
                        className="group relative aspect-square overflow-hidden rounded-sm border border-border bg-muted"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.previewUrl}
                          alt={`Additional product photo ${index + 1}`}
                          className="h-full w-full object-cover"
                        />

                        <div className="absolute inset-x-2 bottom-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => promoteGalleryImage(image.id)}
                            disabled={isSaving}
                            className="flex-1 rounded-sm bg-background/90 px-2 py-1 text-[11px] font-medium text-foreground shadow-sm hover:bg-background"
                          >
                            Make primary
                          </button>

                          <button
                            type="button"
                            onClick={() => removeGalleryImage(image.id)}
                            disabled={isSaving}
                            aria-label={`Remove image ${index + 1}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-sm bg-background/90 text-muted-foreground shadow-sm hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={isSaving}
                    className="flex min-h-36 w-full flex-col items-center justify-center rounded-sm border border-dashed border-border bg-muted/30 px-4 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
                  >
                    <Plus className="h-6 w-6 text-muted-foreground" />
                    <span className="mt-2 text-sm font-medium text-foreground">
                      Add more product images
                    </span>
                    <span className="mt-0.5 text-xs text-muted-foreground">
                      Optional: back, side, detail, or lifestyle photos
                    </span>
                  </button>
                )}

                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="hidden"
                  onChange={addGalleryImages}
                  disabled={isSaving}
                />

                <p className="mt-2 text-xs text-muted-foreground">
                  JPG, PNG, and WebP up to 8 MB each.
                </p>
              </div>
            </div>
          </section>

          <section className="card-surface p-4 shadow-soft">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <Layers className="h-4 w-4" />
              </span>

              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Basics
                </h2>

                <p className="text-xs text-muted-foreground">
                  Product URL is generated automatically from the name.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="name">Product name *</Label>

                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Example: Dino cotton T-shirt"
                  disabled={isSaving}
                  required
                />

                <p className="text-xs text-muted-foreground">
                  Product URL:{" "}
                  <span className="font-mono text-foreground">
                    /products/{generatedSlug}
                  </span>
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category">Category *</Label>

                <Select
                  id="category"
                  value={form.categoryId}
                  onChange={(event) =>
                    updateField("categoryId", event.target.value)
                  }
                  disabled={isSaving}
                  required
                >
                  <option value="">Select category</option>

                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>

                <Select
                  id="status"
                  value={form.status}
                  onChange={(event) =>
                    updateField("status", event.target.value)
                  }
                  disabled={isSaving}
                >
                  <option value="draft">Draft — hidden from store</option>
                  <option value="active">Active — visible in store</option>
                  <option value="archived">Archived</option>
                </Select>
              </div>
            </div>
          </section>

          <section className="card-surface p-4 shadow-soft">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <Package className="h-4 w-4" />
              </span>

              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Collections
                </h2>

                <p className="text-xs text-muted-foreground">
                  Optional. Add this product to seasonal or curated collections.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
              <div className="min-h-11 rounded-sm border border-dashed border-border bg-muted/30 p-2">
                {selectedCollectionIds.length ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedCollectionIds.map((collectionId) => {
                      const collection = collections.find(
                        (item) => item.id === collectionId
                      );

                      if (!collection) {
                        return null;
                      }

                      return (
                        <span
                          key={collection.id}
                          className="inline-flex items-center gap-1.5 rounded-sm bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                        >
                          {collection.name}

                          <button
                            type="button"
                            onClick={() => removeCollection(collection.id)}
                            disabled={isSaving}
                            aria-label={`Remove ${collection.name}`}
                            className="rounded-sm text-primary/70 transition-colors hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="px-1 py-1 text-sm text-muted-foreground">
                    Not assigned to any collection.
                  </p>
                )}
              </div>

              <Select
                value=""
                onChange={(event) => addCollection(event.target.value)}
                disabled={isSaving}
              >
                <option value="">Add to collection</option>

                {collections
                  .filter(
                    (collection) =>
                      !selectedCollectionIds.includes(collection.id)
                  )
                  .map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
              </Select>
            </div>
          </section>

          <section className="card-surface p-4 shadow-soft">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-4 w-4" />
              </span>

              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Price
                </h2>

                <p className="text-xs text-muted-foreground">
                  Old price is optional and displays a discount in the store.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_180px]">
              <div className="space-y-1.5">
                <Label htmlFor="price">Selling price (PKR) *</Label>

                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="1"
                  value={form.price}
                  onChange={(event) =>
                    updateField("price", event.target.value)
                  }
                  placeholder="2499"
                  disabled={isSaving}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="compareAtPrice">Old price</Label>

                <Input
                  id="compareAtPrice"
                  type="number"
                  min="0"
                  step="1"
                  value={form.compareAtPrice}
                  onChange={(event) =>
                    updateField("compareAtPrice", event.target.value)
                  }
                  placeholder="2999"
                  disabled={isSaving}
                />
              </div>

              <div className="rounded-sm border border-border bg-muted/40 p-2.5">
                <p className="text-xs text-muted-foreground">Store preview</p>

                <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                  {formatPKR(price)}
                </p>

                {compareAtPrice > price ? (
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-xs tabular-nums text-muted-foreground line-through">
                      {formatPKR(compareAtPrice)}
                    </span>

                    <span className="rounded-sm bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                      {discountPercent}% OFF
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {compareAtPrice > 0 && compareAtPrice < price ? (
              <p className="mt-2 text-xs text-destructive">
                Old price must be higher than selling price.
              </p>
            ) : null}
          </section>

          <section className="card-surface p-4 shadow-soft">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Ruler className="h-4 w-4" />
                </span>

                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Sizes and stock
                  </h2>

                  <p className="text-xs text-muted-foreground">
                    Select available sizes and write stock for each size.
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                <span className="font-semibold tabular-nums text-foreground">
                  {selectedSizes.length}
                </span>{" "}
                sizes ·{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {totalStock}
                </span>{" "}
                units
              </p>
            </div>

            {sizes.length ? (
              <div className="overflow-hidden rounded-sm border border-border">
                <div className="grid grid-cols-[1fr_120px] border-b border-border bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
                  <span>Available size</span>
                  <span className="text-right">Stock</span>
                </div>

                {sizes.map((size) => {
                  const selected = selectedSizes.find(
                    (item) => item.sizeId === size.id
                  );

                  return (
                    <div
                      key={size.id}
                      className={
                        selected
                          ? "grid grid-cols-[1fr_120px] items-center border-b border-border bg-primary/5 px-4 py-2 last:border-b-0"
                          : "grid grid-cols-[1fr_120px] items-center border-b border-border px-4 py-2 last:border-b-0"
                      }
                    >
                      <label className="flex cursor-pointer items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={Boolean(selected)}
                          onChange={() => toggleSize(size.id)}
                          disabled={isSaving}
                          className="sr-only"
                        />

                        <span
                          className={
                            selected
                              ? "flex h-5 w-5 items-center justify-center rounded-sm bg-primary text-primary-foreground"
                              : "flex h-5 w-5 rounded-sm border border-border bg-card"
                          }
                        >
                          {selected ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : null}
                        </span>

                        <span className="text-sm font-medium text-foreground">
                          {size.label}
                        </span>
                      </label>

                      {selected ? (
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          value={selected.stockQty}
                          onFocus={() => handleSizeStockFocus(size.id)}
                          onBlur={() => handleSizeStockBlur(size.id)}
                          onChange={(event) =>
                            updateSizeStock(size.id, event.target.value)
                          }
                          disabled={isSaving}
                          aria-label={`${size.label} stock quantity`}
                          placeholder="0"
                          className="h-8 text-right tabular-nums"
                        />
                      ) : (
                        <span className="text-right text-sm text-muted-foreground">
                          —
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-sm border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
                No sizes were found in the database.
              </div>
            )}
          </section>

          <section className="card-surface overflow-hidden shadow-soft">
            <button
              type="button"
              onClick={() => setShowDetails((current) => !current)}
              className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
            >
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Optional details
                </h2>

                <p className="text-xs text-muted-foreground">
                  Description, type, fabric, occasion, and fit.
                </p>
              </div>

              <ChevronDown
                className={
                  showDetails
                    ? "h-5 w-5 rotate-180 text-muted-foreground transition-transform"
                    : "h-5 w-5 text-muted-foreground transition-transform"
                }
              />
            </button>

            {showDetails ? (
              <div className="border-t border-border px-4 py-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="description">Description</Label>

                    <Textarea
                      id="description"
                      rows={4}
                      value={form.description}
                      onChange={(event) =>
                        updateField("description", event.target.value)
                      }
                      placeholder="Short product description for customers."
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="productType">Product type</Label>

                    <Input
                      id="productType"
                      value={form.productType}
                      onChange={(event) =>
                        updateField("productType", event.target.value)
                      }
                      placeholder="T-shirt"
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fabric">Fabric</Label>

                    <Input
                      id="fabric"
                      value={form.fabric}
                      onChange={(event) =>
                        updateField("fabric", event.target.value)
                      }
                      placeholder="Cotton"
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="occasion">Occasion</Label>

                    <Input
                      id="occasion"
                      value={form.occasion}
                      onChange={(event) =>
                        updateField("occasion", event.target.value)
                      }
                      placeholder="Casual"
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fit">Fit</Label>

                    <Input
                      id="fit"
                      value={form.fit}
                      onChange={(event) =>
                        updateField("fit", event.target.value)
                      }
                      placeholder="Regular"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="h-fit space-y-3 lg:sticky lg:top-6">
          <section className="card-surface p-4 shadow-soft ring-1 ring-primary/15">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Final step
            </p>

            <h2 className="mt-1 text-base font-semibold text-foreground">
              {isEditing
                ? "Save product changes"
                : form.status === "active"
                  ? "Publish product"
                  : "Create draft"}
            </h2>

            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              {isEditing
                ? "Save all updated product details, images, sizes, and collections."
                : form.status === "active"
                  ? "Images upload to Cloudinary and this product becomes visible in the store."
                  : "Images upload to Cloudinary, but this draft stays hidden from customers."}
            </p>

            <div className="mt-3 space-y-2">
              <Button
                type="submit"
                className="w-full"
                loading={isSaving}
                disabled={isSaving}
              >
                {!isSaving ? <Upload className="h-4 w-4" /> : null}
                {isSaving
                  ? "Saving..."
                  : isEditing
                    ? "Save changes"
                    : form.status === "active"
                      ? "Upload and publish"
                      : "Upload and create draft"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() =>
                  router.push(
                    isEditing
                      ? `/admin/products/${product.id}`
                      : "/admin/products"
                  )
                }
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </section>

          <section className="card-surface p-4 shadow-soft">
            <h3 className="text-sm font-semibold text-foreground">
              Ready checklist
            </h3>

            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li
                className={
                  primaryImage
                    ? "flex items-center gap-1.5 text-success"
                    : "flex items-center gap-1.5"
                }
              >
                {primaryImage ? "✓" : "○"} Primary image
              </li>

              <li
                className={
                  form.name.trim()
                    ? "flex items-center gap-1.5 text-success"
                    : "flex items-center gap-1.5"
                }
              >
                {form.name.trim() ? "✓" : "○"} Product name
              </li>

              <li
                className={
                  form.categoryId
                    ? "flex items-center gap-1.5 text-success"
                    : "flex items-center gap-1.5"
                }
              >
                {form.categoryId ? "✓" : "○"} Category
              </li>

              <li
                className={
                  form.price !== ""
                    ? "flex items-center gap-1.5 text-success"
                    : "flex items-center gap-1.5"
                }
              >
                {form.price !== "" ? "✓" : "○"} Selling price
              </li>

              <li
                className={
                  selectedSizes.length
                    ? "flex items-center gap-1.5 text-success"
                    : "flex items-center gap-1.5"
                }
              >
                {selectedSizes.length ? "✓" : "○"} At least one size
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </form>
  );
}

async function uploadImageToCloudinary(file) {
  const signResponse = await fetch("/api/cloudinary/sign", {
    method: "POST",
  });

  const signData = await signResponse.json();

  if (!signResponse.ok) {
    throw new Error(signData.message || "Could not prepare image upload.");
  }

  const uploadData = new FormData();

  uploadData.append("file", file);
  uploadData.append("api_key", signData.apiKey);
  uploadData.append("timestamp", String(signData.timestamp));
  uploadData.append("folder", signData.folder);
  uploadData.append("signature", signData.signature);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
    {
      method: "POST",
      body: uploadData,
    }
  );

  const uploadResult = await uploadResponse.json();

  if (!uploadResponse.ok || !uploadResult.secure_url) {
    throw new Error(uploadResult.error?.message || "Image upload failed.");
  }

  return uploadResult.secure_url;
}

function makeLocalImage(file) {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
    file,
    previewUrl: URL.createObjectURL(file),
  };
}