import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Eye,
  Package,
  ShoppingBag,
  Store,
  TrendingUp,
  Truck,
  XCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { formatNumber, formatPKR } from "@/lib/utils";

export const dynamic = "force-dynamic";

function getLastSevenDaysStart() {
  const date = new Date();

  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - 6);

  return date;
}

function getOrderStatusStats(orders) {
  return {
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
}

function getDailyOrderData(orders) {
  const startDate = getLastSevenDaysStart();

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startDate);

    date.setDate(startDate.getDate() + index);

    return {
      key: date.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat("en-PK", {
        weekday: "short",
      }).format(date),
      orders: 0,
      revenue: 0,
    };
  });

  const dailyMap = new Map(days.map((day) => [day.key, day]));

  for (const order of orders) {
    if (!order.created_at) {
      continue;
    }

    const createdAt = new Date(order.created_at);

    if (Number.isNaN(createdAt.getTime()) || createdAt < startDate) {
      continue;
    }

    const dayKey = createdAt.toISOString().slice(0, 10);
    const day = dailyMap.get(dayKey);

    if (!day) {
      continue;
    }

    day.orders += 1;

    if (
      String(order.order_status || "").toLowerCase() === "delivered"
    ) {
      day.revenue += Number(order.total_amount || 0);
    }
  }

  return days;
}

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const [ordersResult, productsResult, collectionsResult] = await Promise.all([
    supabase
      .from("orders")
      .select(
        `
          id,
          order_number,
          total_amount,
          order_status,
          payment_method,
          payment_status,
          created_at
        `
      )
      .order("created_at", { ascending: false }),

    supabase
      .from("products")
      .select(
        `
          id,
          name,
          slug,
          status,
          price,
          created_at
        `
      )
      .order("created_at", { ascending: false }),

    supabase
      .from("collections")
      .select(
        `
          id,
          name,
          is_active
        `
      ),
  ]);

  const orders = ordersResult.data || [];
  const products = productsResult.data || [];
  const collections = collectionsResult.data || [];

  const hasError =
    ordersResult.error || productsResult.error || collectionsResult.error;

  const orderStats = getOrderStatusStats(orders);

  const deliveredOrders = orders.filter(
    (order) =>
      String(order.order_status || "").toLowerCase() === "delivered"
  );

  const deliveredRevenue = deliveredOrders.reduce(
    (total, order) => total + Number(order.total_amount || 0),
    0
  );

  const allNonCancelledOrders = orders.filter(
    (order) =>
      String(order.order_status || "").toLowerCase() !== "cancelled"
  );

  const averageOrderValue = allNonCancelledOrders.length
    ? allNonCancelledOrders.reduce(
        (total, order) => total + Number(order.total_amount || 0),
        0
      ) / allNonCancelledOrders.length
    : 0;

  const activeProducts = products.filter(
    (product) => product.status === "active"
  ).length;

  const activeCollections = collections.filter(
    (collection) => collection.is_active
  ).length;

  const lastSevenDaysStart = getLastSevenDaysStart();

  const recentOrders = orders.filter((order) => {
    if (!order.created_at) {
      return false;
    }

    const createdAt = new Date(order.created_at);

    return (
      !Number.isNaN(createdAt.getTime()) &&
      createdAt >= lastSevenDaysStart
    );
  });

  const recentDeliveredOrders = recentOrders.filter(
    (order) =>
      String(order.order_status || "").toLowerCase() === "delivered"
  );

  const recentDeliveredRevenue = recentDeliveredOrders.reduce(
    (total, order) => total + Number(order.total_amount || 0),
    0
  );

  const dailyData = getDailyOrderData(orders);

  const maxDailyOrders = Math.max(
    ...dailyData.map((day) => day.orders),
    1
  );

  const recentProducts = products.slice(0, 5);

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Sales, order flow, and catalog performance."
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Analytics" },
        ]}
      />

      {hasError ? (
        <div
          role="alert"
          className="mb-4 rounded-sm border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"
        >
          Some analytics data could not be loaded. No dummy data is shown.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Delivered revenue"
          value={formatPKR(deliveredRevenue)}
          detail="From completed orders"
          tone="success"
        />

        <StatCard
          icon={<ShoppingBag className="h-4 w-4" />}
          label="Delivered orders"
          value={formatNumber(deliveredOrders.length)}
          detail="Completed customer orders"
          tone="success"
        />

        <StatCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="Average order value"
          value={formatPKR(averageOrderValue)}
          detail="Excludes cancelled orders"
          tone="accent"
        />

        <StatCard
          icon={<Package className="h-4 w-4" />}
          label="Active products"
          value={formatNumber(activeProducts)}
          detail={`${formatNumber(products.length)} catalog products`}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
        <section className="card-surface overflow-hidden shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />

                <h2 className="font-semibold text-foreground">
                  Order activity
                </h2>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Orders placed during the last 7 days.
              </p>
            </div>

            <span className="rounded-sm bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {formatNumber(recentOrders.length)} orders
            </span>
          </div>

          <div className="px-5 py-5 sm:px-6">
            <div className="flex h-44 items-end gap-2 sm:gap-3">
              {dailyData.map((day) => {
                const heightPercent = Math.max(
                  (day.orders / maxDailyOrders) * 100,
                  day.orders ? 10 : 3
                );

                return (
                  <div
                    key={day.key}
                    className="group flex min-w-0 flex-1 flex-col items-center justify-end"
                  >
                    <div className="relative flex h-36 w-full items-end">
                      <div
                        className="w-full rounded-t-sm bg-primary/20 transition-colors group-hover:bg-primary/35"
                        style={{
                          height: `${heightPercent}%`,
                        }}
                        title={`${day.orders} order${
                          day.orders === 1 ? "" : "s"
                        }`}
                      >
                        {day.orders ? (
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold tabular-nums text-foreground">
                            {day.orders}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <p className="mt-2 text-[11px] font-medium text-muted-foreground">
                      {day.label}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  Orders placed
                </p>

                <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                  {formatNumber(recentOrders.length)}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Delivered revenue
                </p>

                <p className="mt-1 text-lg font-semibold tabular-nums text-success">
                  {formatPKR(recentDeliveredRevenue)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="card-surface overflow-hidden shadow-soft">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />

                <h2 className="font-semibold text-foreground">
                  Order pipeline
                </h2>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Current fulfillment workload.
              </p>
            </div>

            <Link
              href="/admin/orders"
              className="text-xs font-medium text-primary hover:underline"
            >
              View orders
            </Link>
          </div>

          <div className="divide-y divide-border">
            <Link
              href="/admin/orders?status=ordered"
              className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-amber-500/[0.04]"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  <Clock3 className="h-4 w-4" />
                </span>

                <div>
                  <p className="text-sm font-medium text-foreground">
                    New orders
                  </p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Waiting for dispatch
                  </p>
                </div>
              </div>

              <span className="text-lg font-semibold tabular-nums text-amber-700 dark:text-amber-300">
                {formatNumber(orderStats.ordered)}
              </span>
            </Link>

            <Link
              href="/admin/orders?status=shipped"
              className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-blue-500/[0.04]"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-blue-500/10 text-blue-700 dark:text-blue-300">
                  <Truck className="h-4 w-4" />
                </span>

                <div>
                  <p className="text-sm font-medium text-foreground">
                    Shipped orders
                  </p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Awaiting delivery confirmation
                  </p>
                </div>
              </div>

              <span className="text-lg font-semibold tabular-nums text-blue-700 dark:text-blue-300">
                {formatNumber(orderStats.shipped)}
              </span>
            </Link>

            <Link
              href="/admin/orders?status=delivered"
              className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-emerald-500/[0.04]"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                </span>

                <div>
                  <p className="text-sm font-medium text-foreground">
                    Delivered orders
                  </p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Completed sales
                  </p>
                </div>
              </div>

              <span className="text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                {formatNumber(orderStats.delivered)}
              </span>
            </Link>

            <Link
              href="/admin/orders?status=cancelled"
              className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-destructive/[0.04]"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-destructive/10 text-destructive">
                  <XCircle className="h-4 w-4" />
                </span>

                <div>
                  <p className="text-sm font-medium text-foreground">
                    Cancelled orders
                  </p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Closed orders
                  </p>
                </div>
              </div>

              <span className="text-lg font-semibold tabular-nums text-destructive">
                {formatNumber(orderStats.cancelled)}
              </span>
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="card-surface overflow-hidden shadow-soft">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />

                <h2 className="font-semibold text-foreground">
                  Recently added products
                </h2>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Latest additions to your catalog.
              </p>
            </div>

            <Link
              href="/admin/products"
              className="text-xs font-medium text-primary hover:underline"
            >
              Manage products
            </Link>
          </div>

          {recentProducts.length ? (
            <ul className="divide-y divide-border">
              {recentProducts.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-muted/30"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {product.name}
                      </p>

                      <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                        /{product.slug}
                      </p>
                    </div>

                    <span
                      className={
                        product.status === "active"
                          ? "shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success"
                          : product.status === "archived"
                            ? "shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                            : "shrink-0 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning"
                      }
                    >
                      {product.status === "active"
                        ? "Active"
                        : product.status === "archived"
                          ? "Archived"
                          : "Draft"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              No products have been added yet.
            </div>
          )}
        </section>

        <section className="card-surface overflow-hidden shadow-soft">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />

                <h2 className="font-semibold text-foreground">
                  Storefront traffic
                </h2>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Product and store visit tracking.
              </p>
            </div>

            <span className="rounded-sm bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Coming later
            </span>
          </div>

          <div className="flex min-h-52 flex-col items-center justify-center px-5 py-10 text-center">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-sm bg-primary/10 text-primary">
              <Store className="h-5 w-5" />
            </span>

            <h3 className="mt-4 font-semibold text-foreground">
              Traffic tracking starts with the storefront
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Store views, product views, campaign sources, and top-viewed
              products will begin recording once the public storefront is
              built and tracking is enabled.
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <span className="rounded-sm bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                Store views
              </span>

              <span className="rounded-sm bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                Product views
              </span>

              <span className="rounded-sm bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                UTM campaigns
              </span>
            </div>
          </div>
        </section>
      </div>

      <section className="card-surface mt-4 p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Catalog health
            </p>

            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {formatNumber(activeProducts)} active products
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Across {formatNumber(products.length)} catalog products and{" "}
              {formatNumber(activeCollections)} active collections.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/products/new"
              className="inline-flex h-9 items-center gap-2 rounded-sm bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Package className="h-4 w-4" />
              Add product
            </Link>

            <Link
              href="/admin/collections"
              className="inline-flex h-9 items-center gap-2 rounded-sm border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Store className="h-4 w-4" />
              Collections
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}