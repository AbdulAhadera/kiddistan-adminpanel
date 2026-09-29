import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FolderTree,
  Package,
  PackageCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatNumber, formatPKR } from "@/lib/utils";

export const dynamic = "force-dynamic";

function getStockTone(stockQty) {
  if (Number(stockQty) === 0) {
    return {
      label: "Sold out",
      className: "bg-destructive/10 text-destructive",
    };
  }

  return {
    label: `${stockQty} left`,
    className: "bg-warning/10 text-warning",
  };
}

function getOrderAction(orderStatus) {
  const status = String(orderStatus || "ordered").toLowerCase();

  if (status === "ordered") {
    return {
      label: "Ship order",
      href: "/admin/orders?status=ordered",
      icon: <Truck className="h-3.5 w-3.5" />,
      className:
        "bg-blue-500/10 text-blue-700 hover:bg-blue-500/15 dark:text-blue-300",
    };
  }

  if (status === "shipped") {
    return {
      label: "Confirm delivery",
      href: "/admin/orders?status=shipped",
      icon: <PackageCheck className="h-3.5 w-3.5" />,
      className:
        "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300",
    };
  }

  return null;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    ordersResult,
    productsResult,
    categoriesResult,
    stockResult,
    collectionsResult,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select(
        `
          id,
          order_number,
          customer_name,
          customer_phone,
          city,
          payment_method,
          payment_status,
          total_amount,
          order_status,
          created_at
        `
      )
      .order("created_at", { ascending: false }),

    supabase
      .from("products")
      .select("id, name, status, primary_image")
      .order("created_at", { ascending: false }),

    supabase.from("categories").select("id"),

    supabase
      .from("product_sizes")
      .select(
        `
          id,
          product_id,
          stock_qty,
          sizes (
            label
          )
        `
      )
      .lte("stock_qty", 4)
      .order("stock_qty", { ascending: true }),

    supabase.from("collections").select("id, is_active"),
  ]);

  const orders = ordersResult.data || [];
  const products = productsResult.data || [];
  const categories = categoriesResult.data || [];
  const lowStockItems = stockResult.data || [];
  const collections = collectionsResult.data || [];

  const productsById = new Map(
    products.map((product) => [product.id, product])
  );

  const orderCounts = {
    ordered: orders.filter(
      (order) =>
        String(order.order_status || "ordered").toLowerCase() === "ordered"
    ).length,

    shipped: orders.filter(
      (order) =>
        String(order.order_status || "").toLowerCase() === "shipped"
    ).length,

    delivered: orders.filter(
      (order) =>
        String(order.order_status || "").toLowerCase() === "delivered"
    ).length,

    cancelled: orders.filter(
      (order) =>
        String(order.order_status || "").toLowerCase() === "cancelled"
    ).length,
  };

  const activeProductCount = products.filter(
    (product) => product.status === "active"
  ).length;

  const activeCollectionCount = collections.filter(
    (collection) => collection.is_active
  ).length;

  const deliveredRevenue = orders
    .filter(
      (order) =>
        String(order.order_status || "").toLowerCase() === "delivered"
    )
    .reduce((total, order) => total + Number(order.total_amount || 0), 0);

  const pendingOrderQueue = orders.filter((order) => {
    const status = String(order.order_status || "ordered").toLowerCase();

    return status === "ordered" || status === "shipped";
  });

  const recentOrders = orders.slice(0, 6);

  const hasError =
    ordersResult.error ||
    productsResult.error ||
    categoriesResult.error ||
    stockResult.error ||
    collectionsResult.error;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Store operations at a glance."
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Dashboard" },
        ]}
        action={{
          label: "Add product",
          href: "/admin/products/new",
          icon: <Package className="h-4 w-4" />,
        }}
      />

      {hasError ? (
        <div
          role="alert"
          className="mb-4 rounded-sm border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"
        >
          Some dashboard data could not be loaded. No dummy data is shown.
        </div>
      ) : null}

      <section className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Link
          href="/admin/orders?status=ordered"
          className="card-surface group px-4 py-4 shadow-soft transition-colors hover:border-amber-500/30 hover:bg-amber-500/[0.03]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                New orders
              </p>

              <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-700 dark:text-amber-300">
                {formatNumber(orderCounts.ordered)}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Waiting for dispatch
              </p>
            </div>

            <span className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <Clock3 className="h-4 w-4" />
            </span>
          </div>
        </Link>

        <Link
          href="/admin/orders?status=shipped"
          className="card-surface group px-4 py-4 shadow-soft transition-colors hover:border-blue-500/30 hover:bg-blue-500/[0.03]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Shipped
              </p>

              <p className="mt-1 text-2xl font-semibold tabular-nums text-blue-700 dark:text-blue-300">
                {formatNumber(orderCounts.shipped)}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Awaiting delivery confirmation
              </p>
            </div>

            <span className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-blue-500/10 text-blue-700 dark:text-blue-300">
              <Truck className="h-4 w-4" />
            </span>
          </div>
        </Link>

        <Link
          href="/admin/products"
          className="card-surface group px-4 py-4 shadow-soft transition-colors hover:border-destructive/30 hover:bg-destructive/[0.03]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Low-stock sizes
              </p>

              <p className="mt-1 text-2xl font-semibold tabular-nums text-destructive">
                {formatNumber(lowStockItems.length)}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                4 or fewer units available
              </p>
            </div>

            <span className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-destructive/10 text-destructive">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
        </Link>

        <Link
          href="/admin/orders?status=delivered"
          className="card-surface group px-4 py-4 shadow-soft transition-colors hover:border-primary/30 hover:bg-primary/[0.03]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Delivered revenue
              </p>

              <p className="mt-1 text-2xl font-semibold tabular-nums text-primary">
                {formatPKR(deliveredRevenue)}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                From completed orders
              </p>
            </div>

            <span className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-primary/10 text-primary">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
        </Link>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <section className="card-surface overflow-hidden shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />

                <h2 className="font-semibold text-foreground">
                  Fulfillment queue
                </h2>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Orders that require a delivery action.
              </p>
            </div>

            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:underline"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {pendingOrderQueue.length ? (
            <div className="divide-y divide-border">
              {pendingOrderQueue.slice(0, 5).map((order) => {
                const orderStatus = String(
                  order.order_status || "ordered"
                ).toLowerCase();

                const action = getOrderAction(orderStatus);

                return (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 px-5 py-3.5"
                  >
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="min-w-0 flex-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="font-medium text-foreground transition-colors hover:text-primary">
                          {order.order_number}
                        </p>

                        <StatusBadge value={orderStatus} />
                      </div>

                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {order.customer_name || "—"} · {order.city || "—"} ·{" "}
                        {formatPKR(Number(order.total_amount || 0))}
                      </p>
                    </Link>

                    {action ? (
                      <Link
                        href={action.href}
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-semibold transition-colors ${action.className}`}
                      >
                        {action.icon}
                        {action.label}
                      </Link>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center px-5 py-12 text-center">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-sm bg-success/10 text-success">
                <CheckCircle2 className="h-5 w-5" />
              </span>

              <h3 className="mt-3 text-sm font-semibold text-foreground">
                Fulfillment queue is clear
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                No orders are waiting to be shipped or delivered.
              </p>
            </div>
          )}
        </section>

        <section className="card-surface overflow-hidden shadow-soft">
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />

                <h2 className="font-semibold text-foreground">
                  Inventory attention
                </h2>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Variants at 4 or fewer units.
              </p>
            </div>

            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:underline"
            >
              Products
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {lowStockItems.length ? (
            <ul className="divide-y divide-border">
              {lowStockItems.slice(0, 5).map((item) => {
                const product = productsById.get(item.product_id);
                const stockTone = getStockTone(Number(item.stock_qty || 0));

                return (
                  <li key={item.id}>
                    <Link
                      href={`/admin/products/${item.product_id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {product?.name || "Unknown product"}
                        </p>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Size: {item.sizes?.label || "—"}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-sm px-2 py-1 text-xs font-semibold ${stockTone.className}`}
                      >
                        {stockTone.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center px-5 py-12 text-center">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-sm bg-success/10 text-success">
                <PackageCheck className="h-5 w-5" />
              </span>

              <h3 className="mt-3 text-sm font-semibold text-foreground">
                Inventory looks healthy
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                No product size is currently at the low-stock threshold.
              </p>
            </div>
          )}
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="card-surface overflow-hidden shadow-soft">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="font-semibold text-foreground">Recent orders</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Latest customer activity.
              </p>
            </div>

            <Link
              href="/admin/orders"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all orders
            </Link>
          </div>

          {recentOrders.length ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <TableCell>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {order.order_number}
                      </Link>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDateTime(order.created_at)}
                      </p>
                    </TableCell>

                    <TableCell>
                      <p className="truncate font-medium text-foreground">
                        {order.customer_name || "—"}
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {order.city || "—"}
                      </p>
                    </TableCell>

                    <TableCell className="text-right font-medium tabular-nums text-foreground">
                      {formatPKR(Number(order.total_amount || 0))}
                    </TableCell>

                    <TableCell>
                      <StatusBadge value={order.order_status || "ordered"} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No orders have been placed yet.
            </div>
          )}
        </section>

        <section className="card-surface p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Store overview
          </p>

          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <p className="text-xs text-muted-foreground">Catalog products</p>

              <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                {formatNumber(products.length)}
              </p>

              <p className="mt-1 text-xs text-success">
                {formatNumber(activeProductCount)} active
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Categories</p>

              <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                {formatNumber(categories.length)}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Store navigation
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Active collections
              </p>

              <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                {formatNumber(activeCollectionCount)}
              </p>

              <Link
                href="/admin/collections"
                className="mt-1 inline-flex text-xs text-primary hover:underline"
              >
                Manage collections
              </Link>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Delivered orders
              </p>

              <p className="mt-1 text-lg font-semibold tabular-nums text-success">
                {formatNumber(orderCounts.delivered)}
              </p>

              <Link
                href="/admin/orders?status=delivered"
                className="mt-1 inline-flex text-xs text-primary hover:underline"
              >
                View delivered
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}