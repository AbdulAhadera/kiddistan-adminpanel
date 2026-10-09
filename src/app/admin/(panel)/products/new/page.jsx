import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ProductForm } from "@/components/products/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const supabase = await createClient();

  const [categoriesResult, sizesResult, collectionsResult] =
    await Promise.all([
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

  const hasError =
    categoriesResult.error ||
    sizesResult.error ||
    collectionsResult.error;

  return (
    <>
      <PageHeader
        title="Add product"
        subtitle="Upload photos, add the basics, set stock, and save."
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Products", href: "/admin/products" },
          { label: "Add product" },
        ]}
      />

      {hasError ? (
        <div className="mb-4 rounded-sm border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Product setup data could not load completely. Check categories,
          sizes, and collections before saving.
        </div>
      ) : null}

      <ProductForm
        categories={categoriesResult.data || []}
        sizes={sizesResult.data || []}
        collections={collectionsResult.data || []}
      />
    </>
  );
}