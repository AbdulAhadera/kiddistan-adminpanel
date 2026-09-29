import Link from "next/link";
import { Package, Plus } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ProductTableRow } from "@/components/products/product-table-row";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const supabase = await createClient();

  const [
    productsResult,
    categoriesResult,
    stockResult,
    productViewsResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select(
        `
          id,
          name,
          slug,
          price,
          status,
          primary_image,
          category_id,
          created_at
        `
      )
      .order("created_at", { ascending: false }),

    supabase.from("categories").select("id, name"),

    supabase.from("product_sizes").select("product_id, stock_qty"),

    supabase.from("product_views").select("product_id"),
  ]);

  const products = productsResult.data || [];
  const categories = categoriesResult.data || [];
  const stockRows = stockResult.data || [];
  const productViews = productViewsResult.data || [];

  const categoryById = new Map(
    categories.map((category) => [category.id, category.name])
  );

  const stockByProductId = stockRows.reduce((summary, row) => {
    const productId = row.product_id;

    const current = summary.get(productId) || {
      totalStock: 0,
      sizeCount: 0,
    };

    current.totalStock += Number(row.stock_qty || 0);
    current.sizeCount += 1;

    summary.set(productId, current);

    return summary;
  }, new Map());

  const viewsByProductId = productViews.reduce((summary, view) => {
    const productId = view.product_id;

    if (!productId) {
      return summary;
    }

    summary.set(productId, (summary.get(productId) || 0) + 1);

    return summary;
  }, new Map());

  const hasError =
    productsResult.error ||
    categoriesResult.error ||
    stockResult.error ||
    productViewsResult.error;

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={`${formatNumber(products.length)} products in your catalog`}
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Products" },
        ]}
        action={{
          label: "Add product",
          href: "/admin/products/new",
          icon: <Plus className="h-4 w-4" />,
        }}
      />

      {hasError ? (
        <div
          role="alert"
          className="mb-4 rounded-sm border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"
        >
          Products could not load completely. No dummy data is shown.
        </div>
      ) : null}

      <section className="card-surface overflow-hidden shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-semibold text-foreground">
              Product catalog
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Click a row to view a product. Use the pencil to edit it.
            </p>
          </div>

          <span className="rounded-sm bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {formatNumber(products.length)} total
          </span>
        </div>

        {products.length ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="hidden md:table-cell">
                  Views
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  Category
                </TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="hidden sm:table-cell">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-14 text-right">Edit</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {products.map((product) => {
                const stock = stockByProductId.get(product.id) || {
                  totalStock: 0,
                  sizeCount: 0,
                };

                const categoryName =
                  categoryById.get(product.category_id) || "Uncategorized";

                const viewCount = viewsByProductId.get(product.id) || 0;

                return (
                  <ProductTableRow
                    key={product.id}
                    product={product}
                    categoryName={categoryName}
                    stock={stock}
                    viewCount={viewCount}
                  />
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-muted text-muted-foreground">
              <Package className="h-5 w-5" />
            </div>

            <h2 className="mt-4 font-semibold text-foreground">
              No products yet
            </h2>

            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Add your first product to start building the Kiddistan catalog.
            </p>

            <Link
              href="/admin/products/new"
              className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-sm bg-primary px-3.5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add product
            </Link>
          </div>
        )}
      </section>
    </>
  );
}