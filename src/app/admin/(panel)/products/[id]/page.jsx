import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowLeft,
  CalendarDays,
  Eye,
  FolderKanban,
  ImageIcon,
  Package,
  Pencil,
  Tag,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, formatPKR } from "@/lib/utils";

export const dynamic = "force-dynamic";

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-0.5 text-sm font-medium text-foreground">
        {value || "—"}
      </p>
    </div>
  );
}

function getProductImages(product) {
  const imageRows = product.product_images || [];

  return [
    product.primary_image
      ? {
        id: "primary-image",
        image_url: product.primary_image,
        is_primary: true,
        sort_order: 0,
      }
      : null,
    ...imageRows,
  ]
    .filter((image) => image?.image_url)
    .filter(
      (image, index, allImages) =>
        allImages.findIndex(
          (item) => item.image_url === image.image_url
        ) === index
    )
    .sort((a, b) => {
      if (a.is_primary) {
        return -1;
      }

      if (b.is_primary) {
        return 1;
      }

      return Number(a.sort_order || 0) - Number(b.sort_order || 0);
    });
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const [productResult, viewsResult] = await Promise.all([
    supabase
      .from("products")
      .select(
        `
        id,
        name,
        slug,
        sku,
        description,
        product_type,
        price,
        compare_at_price,
        currency,
        status,
        attr_fabric,
        attr_occasion,
        attr_fit,
        primary_image,
        created_at,
        updated_at,
        categories (
          id,
          name,
          slug
        ),
        product_images (
          id,
          image_url,
          is_primary,
          sort_order
        ),
        product_sizes (
          id,
          stock_qty,
          sizes (
            id,
            label,
            sort_order
          )
        ),
        product_collections (
          collection_id,
          collections (
            id,
            name,
            slug
          )
        )
      `
      )
      .eq("id", id)
      .single(),

    supabase
      .from("product_views")
      .select("id, viewed_at")
      .eq("product_id", id)
      .order("viewed_at", { ascending: false }),
  ]);

  const product = productResult.data;
  const error = productResult.error;

  const productViews = viewsResult.data || [];
  const productViewsError = viewsResult.error;

  if (error || !product) {
    notFound();
  }

  if (productViewsError) {
    console.error("Product views load error:", productViewsError);
  }

  const productImages = getProductImages(product);

  const productSizes = [...(product.product_sizes || [])].sort((a, b) => {
    return (
      Number(a.sizes?.sort_order || 0) -
      Number(b.sizes?.sort_order || 0)
    );
  });

  const totalStock = productSizes.reduce((total, item) => {
    return total + Number(item.stock_qty || 0);
  }, 0);

  const collections = (product.product_collections || [])
    .map((item) => item.collections)
    .filter(Boolean);

  const price = Number(product.price || 0);
  const compareAtPrice = Number(product.compare_at_price || 0);

  const hasDiscount = compareAtPrice > price && price > 0;

  const discountPercent = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  return (
    <>
      <PageHeader
        title={product.name}
        subtitle={`SKU: ${product.sku}`}
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Products", href: "/admin/products" },
          { label: product.name },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/products"
              className="inline-flex h-9 items-center gap-2 rounded-sm border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to products
            </Link>

            <Link
              href={`/admin/products/${product.id}/edit`}
              className="inline-flex h-9 items-center gap-2 rounded-sm bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Pencil className="h-4 w-4" />
              Edit product
            </Link>
          </div>
        }
      />

      <div className="mx-auto max-w-auto pb-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <StatusBadge value={product.status} kind="product" />

          {product.categories ? (
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <FolderKanban className="h-3.5 w-3.5" />
              {product.categories.name}
            </span>
          ) : null}

          {product.product_type ? (
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Tag className="h-3.5 w-3.5" />
              {product.product_type}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            <section className="card-surface overflow-hidden shadow-soft">
              <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Product images
                  </h2>

                  <p className="text-xs text-muted-foreground">
                    {productImages.length
                      ? `${productImages.length} photo${productImages.length === 1 ? "" : "s"
                      } uploaded`
                      : "No product photos uploaded"}
                  </p>
                </div>

                <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>

              {productImages.length ? (
                <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
                  {productImages.map((image, index) => (
                    <div
                      key={image.id || `${image.image_url}-${index}`}
                      className="relative aspect-square bg-muted"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.image_url}
                        alt={`${product.name} image ${index + 1}`}
                        className="h-full w-full object-cover"
                      />

                      {image.is_primary || index === 0 ? (
                        <span className="absolute bottom-2 left-2 rounded-sm bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground shadow-sm">
                          Primary image
                        </span>
                      ) : null}

                      <span className="absolute right-2 top-2 inline-flex h-6 min-w-6 items-center justify-center rounded-sm bg-background/90 px-1.5 text-[11px] font-medium text-foreground shadow-sm">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex aspect-[4/3] flex-col items-center justify-center px-4 text-center">
                  <ImageIcon className="h-7 w-7 text-muted-foreground" />

                  <p className="mt-2 text-sm font-medium text-foreground">
                    No product images available
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Add photos by editing this product.
                  </p>
                </div>
              )}
            </section>

            <section className="card-surface overflow-hidden shadow-soft">
              <div className="border-b border-border px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {product.categories?.name || "Uncategorized"}
                  </span>

                  {product.product_type ? (
                    <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">
                      {product.product_type}
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    {product.name}
                  </h2>

                  <p className="font-mono text-xs text-muted-foreground">
                    SKU: {product.sku}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
                <div className="px-4 py-2.5">
                  <p className="text-xs text-muted-foreground">Fabric</p>
                  <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                    {product.attr_fabric || "Not specified"}
                  </p>
                </div>

                <div className="px-4 py-2.5">
                  <p className="text-xs text-muted-foreground">Occasion</p>
                  <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                    {product.attr_occasion || "Not specified"}
                  </p>
                </div>

                <div className="px-4 py-2.5">
                  <p className="text-xs text-muted-foreground">Fit</p>
                  <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                    {product.attr_fit || "Not specified"}
                  </p>
                </div>
              </div>

              <div className="px-4 py-3">
                <p className="text-xs text-muted-foreground">Description</p>

                <p className="mt-1 max-w-3xl whitespace-pre-line text-sm leading-6 text-foreground/90">
                  {product.description || "No product description added yet."}
                </p>
              </div>
            </section>

            <section className="card-surface p-4 shadow-soft">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  Sizes and stock
                </h2>

                <p className="rounded-sm bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {totalStock} total units
                </p>
              </div>

              {productSizes.length ? (
                <div className="overflow-hidden rounded-sm border border-border">
                  <div className="grid grid-cols-[1fr_130px] border-b border-border bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
                    <span>Size</span>
                    <span className="text-right">Stock quantity</span>
                  </div>

                  {productSizes.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr_130px] items-center border-b border-border px-4 py-2 last:border-b-0"
                    >
                      <span className="text-sm font-medium text-foreground">
                        {item.sizes?.label || "Unknown size"}
                      </span>

                      <span
                        className={
                          Number(item.stock_qty) > 0
                            ? "text-right text-sm font-semibold tabular-nums text-success"
                            : "text-right text-sm font-semibold tabular-nums text-destructive"
                        }
                      >
                        {item.stock_qty}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-sm border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                  No sizes have been added to this product.
                </div>
              )}
            </section>
          </div>

          <aside className="h-fit space-y-3 lg:sticky lg:top-6">
            <section className="card-surface p-4 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Pricing
              </p>

              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                {formatPKR(price)}
              </p>

              {hasDiscount ? (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm tabular-nums text-muted-foreground line-through">
                    {formatPKR(compareAtPrice)}
                  </span>

                  <span className="rounded-sm bg-success/10 px-1.5 py-0.5 text-xs font-semibold text-success">
                    {discountPercent}% OFF
                  </span>
                </div>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  No compare-at price set.
                </p>
              )}

              <div className="mt-3 border-t border-border pt-3">
                <DetailItem label="Currency" value={product.currency} />
              </div>
            </section>

            <section className="card-surface p-4 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />

                  <h2 className="text-sm font-semibold text-foreground">
                    Product views
                  </h2>
                </div>

                <span className="rounded-sm bg-primary/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-primary">
                  {productViews.length}
                </span>
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                Public storefront product-page visits.
              </p>

              <div className="mt-3 border-t border-border pt-3">
                <DetailItem
                  label="Latest view"
                  value={
                    productViews[0]?.viewed_at
                      ? formatDateTime(productViews[0].viewed_at)
                      : "No views recorded"
                  }
                />
              </div>
            </section>

            <section className="card-surface p-4 shadow-soft">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />

                <h2 className="text-sm font-semibold text-foreground">
                  Collections
                </h2>
              </div>

              {collections.length ? (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {collections.map((collection) => (
                    <Link
                      key={collection.id}
                      href={`/admin/collections/${collection.id}`}
                      className="rounded-sm bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
                    >
                      {collection.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  This product is not assigned to any collection.
                </p>
              )}
            </section>

            <section className="card-surface p-4 shadow-soft">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />

                <h2 className="text-sm font-semibold text-foreground">
                  Product history
                </h2>
              </div>

              <div className="mt-2.5 space-y-2.5">
                <DetailItem
                  label="Created"
                  value={formatDateTime(product.created_at)}
                />

                <DetailItem
                  label="Last updated"
                  value={formatDateTime(product.updated_at)}
                />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}