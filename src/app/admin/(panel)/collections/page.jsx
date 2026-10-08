// src/app/admin/(panel)/collections/page.jsx
import Link from "next/link";
import {
  ChevronDown,
  FolderKanban,
  Layers,
  Package,
  Plus,
} from "lucide-react";


import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, formatPKR } from "@/lib/utils";
import { CreateCollectionForm } from "./create-collection-form";


export const dynamic = "force-dynamic";


function getTotalStock(product) {
  return (product.product_sizes || []).reduce(
    (total, item) => total + Number(item.stock_qty || 0),
    0
  );
}


export default async function CollectionsPage() {
  const supabase = await createClient();


  const { data: collections, error } = await supabase
    .from("collections")
    .select(
      `
        id,
        name,
        slug,
        description,
        is_active,
        created_at,
        product_collections (
          product_id,
          products (
            id,
            name,
            slug,
            sku,
            price,
            primary_image,
            status,
            categories (
              id,
              name
            ),
            product_sizes (
              stock_qty
            )
          )
        )
      `
    )
    .order("created_at", { ascending: false });


  const collectionList = collections || [];


  const totalProducts = collectionList.reduce((total, collection) => {
    return total + Number(collection.product_collections?.length || 0);
  }, 0);


  const activeCollections = collectionList.filter(
    (collection) => collection.is_active
  ).length;


  return (
    <>
      <PageHeader
        title="Collections"
        subtitle="Group products into seasonal, promotional, and curated storefront sections."
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Collections" },
        ]}
      />


      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          Collections could not be loaded. Please refresh the page.
        </div>
      ) : null}


      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="card-surface px-4 py-3 shadow-soft">
          <p className="text-xs font-medium text-muted-foreground">
            Total collections
          </p>


          <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
            {collectionList.length}
          </p>
        </div>


        <div className="card-surface px-4 py-3 shadow-soft">
          <p className="text-xs font-medium text-muted-foreground">
            Active collections
          </p>


          <p className="mt-1 text-xl font-semibold tabular-nums text-success">
            {activeCollections}
          </p>
        </div>


        <div className="card-surface px-4 py-3 shadow-soft">
          <p className="text-xs font-medium text-muted-foreground">
            Product assignments
          </p>


          <p className="mt-1 text-xl font-semibold tabular-nums text-primary">
            {totalProducts}
          </p>
        </div>
      </div>


      <CreateCollectionForm />


      <section className="card-surface overflow-hidden shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-semibold text-foreground">
              All collections
            </h2>


            <p className="mt-1 text-sm text-muted-foreground">
              Click a collection to view all assigned products.
            </p>
          </div>


          <span className="rounded-sm bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {collectionList.length} total
          </span>
        </div>


        {collectionList.length ? (
          <div className="divide-y divide-border">
            {collectionList.map((collection) => {
              const articles = (collection.product_collections || [])
                .map((item) => item.products)
                .filter(Boolean);


              return (
                <details key={collection.id} className="group">
                  <summary className="cursor-pointer list-none transition-colors hover:bg-muted/30">
                    <div className="flex items-center gap-4 px-2 py-2 sm:px-6">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
                        <Layers className="h-5 w-5" />
                      </span>


                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-foreground">
                            {collection.name}
                          </p>


                          <span
                            className={
                              collection.is_active
                                ? "rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success"
                                : "rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                            }
                          >
                            {collection.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>


                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="font-mono">/{collection.slug}</span>


                          <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/50 sm:block" />


                          <span>
                            {articles.length} product
                            {articles.length === 1 ? "" : "s"}
                          </span>


                          <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/50 sm:block" />


                          <span className="hidden sm:inline">
                            Created {formatDateTime(collection.created_at)}
                          </span>
                        </div>


                        {collection.description ? (
                          <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">
                            {collection.description}
                          </p>
                        ) : (
                          <p className="mt-2 text-sm text-muted-foreground">
                            No description added.
                          </p>
                        )}
                      </div>


                      <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                    </div>
                  </summary>


                  <div className="border-t border-border bg-muted/[0.18] px-5 py-5 sm:px-6">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />


                          <h3 className="font-semibold text-foreground">
                            Products in {collection.name}
                          </h3>
                        </div>


                        <p className="mt-1 text-sm text-muted-foreground">
                          {articles.length
                            ? "Click a product row to view the full product details."
                            : "Assign this collection from the product form."}
                        </p>
                      </div>


                      <span className="inline-flex items-center gap-1.5 rounded-sm bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        <Package className="h-3.5 w-3.5" />
                        {articles.length} total
                      </span>
                    </div>


                    {articles.length ? (
                      <div className="overflow-hidden rounded-sm border border-border bg-card">
                        <div className="grid grid-cols-[minmax(0,1fr)_72px] items-center gap-3 border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground sm:grid-cols-[minmax(0,1fr)_120px_110px_82px]">
                          <span>Product</span>
                          <span className="hidden sm:block">Price</span>
                          <span className="hidden sm:block">Status</span>
                          <span className="text-right">Stock</span>
                        </div>


                        {articles.map((product) => {
                          const totalStock = getTotalStock(product);


                          return (
                            <Link
                              key={product.id}
                              href={`/admin/products/${product.id}`}
                              className="grid grid-cols-[minmax(0,1fr)_72px] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 transition-colors hover:bg-primary/5 sm:grid-cols-[minmax(0,1fr)_120px_110px_82px]"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-muted text-muted-foreground">
                                  {product.primary_image ? (
                                    <>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={product.primary_image}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                      />
                                    </>
                                  ) : (
                                    <Layers className="h-4 w-4" />
                                  )}
                                </div>


                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-foreground">
                                    {product.name}
                                  </p>


                                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                    {product.categories?.name ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                        <FolderKanban className="h-3 w-3" />
                                        {product.categories.name}
                                      </span>
                                    ) : null}


                                    <span className="font-mono text-[11px] text-muted-foreground">
                                      {product.sku}
                                    </span>
                                  </div>
                                </div>
                              </div>


                              <span className="hidden text-sm font-medium tabular-nums text-foreground sm:block">
                                {formatPKR(Number(product.price || 0))}
                              </span>


                              <span className="hidden sm:block">
                                <StatusBadge
                                  value={product.status}
                                  kind="product"
                                />
                              </span>


                              <span
                                className={
                                  totalStock > 0
                                    ? "text-right text-sm font-semibold tabular-nums text-success"
                                    : "text-right text-sm font-semibold tabular-nums text-destructive"
                                }
                              >
                                {totalStock}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center rounded-sm border border-dashed border-border bg-card px-4 py-10 text-center">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-sm bg-muted text-muted-foreground">
                          <Package className="h-5 w-5" />
                        </span>


                        <p className="mt-3 text-sm font-medium text-foreground">
                          No products assigned
                        </p>


                        <p className="mt-1 text-sm text-muted-foreground">
                          Edit a product and select this collection to add it.
                        </p>
                      </div>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-primary/10 text-primary">
              <Layers className="h-5 w-5" />
            </div>


            <h2 className="mt-4 font-semibold text-foreground">
              No collections yet
            </h2>


            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Create a collection above, then assign it to products from the
              product form.
            </p>
          </div>
        )}
      </section>
    </>
  );
}