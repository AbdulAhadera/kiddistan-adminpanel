import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ProductForm } from "@/components/products/product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    productResult,
    categoriesResult,
    sizesResult,
    collectionsResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select(`
        id,
        category_id,
        name,
        slug,
        sku,
        description,
        product_type,
        price,
        compare_at_price,
        status,
        attr_fabric,
        attr_occasion,
        attr_fit,
        primary_image,
        product_images (
          id,
          image_url,
          is_primary,
          sort_order
        ),
        product_sizes (
          id,
          size_id,
          stock_qty
        ),
        product_collections (
          collection_id
        )
      `)
      .eq("id", id)
      .single(),

    supabase
      .from("categories")
      .select("id, name, parent_id, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),

    supabase
      .from("sizes")
      .select("id, label, sort_order, applies_to")
      .order("sort_order", { ascending: true }),

    supabase
      .from("collections")
      .select("id, name, slug, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  const product = productResult.data;

  if (productResult.error || !product) {
    notFound();
  }

  const selectedCollectionIds =
    product.product_collections?.map((item) => item.collection_id) ?? [];

  const hasSetupError =
    categoriesResult.error ||
    sizesResult.error ||
    collectionsResult.error;

  return (
    <>
      <PageHeader
        title="Edit product"
        subtitle={`Update ${product.name}`}
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Products", href: "/admin/products" },
          { label: product.name, href: `/admin/products/${id}` },
          { label: "Edit" },
        ]}
      />

      {hasSetupError ? (
        <div className="mb-4 rounded-sm border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Some product setup data could not load. Check categories, sizes, and
          collections before saving.
        </div>
      ) : null}

      <ProductForm
        product={product}
        categories={categoriesResult.data ?? []}
        sizes={sizesResult.data ?? []}
        collections={collectionsResult.data ?? []}
        selectedCollectionIds={selectedCollectionIds}
      />
    </>
  );
}