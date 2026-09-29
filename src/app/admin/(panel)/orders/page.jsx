import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  MapPin,
  PackageCheck,
  Search,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { OrderRowAction } from "@/components/orders/order-row-action";
import { formatDateTime, formatPKR, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusViews = [
  { key: "all", label: "All" },
  { key: "ordered", label: "New" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

function getStatusIcon(status) {
  const normalizedStatus = String(status || "ordered")
    .trim()
    .toLowerCase();

  if (normalizedStatus === "shipped") {
    return <Truck className="h-4 w-4" />;
  }

  if (normalizedStatus === "delivered") {
    return <PackageCheck className="h-4 w-4" />;
  }

  if (normalizedStatus === "cancelled") {
    return <XCircle className="h-4 w-4" />;
  }

  return <Clock3 className="h-4 w-4" />;
}

function getStatusIconClass(status) {
  const normalizedStatus = String(status || "ordered")
    .trim()
    .toLowerCase();

  if (normalizedStatus === "shipped") {
    return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
  }

  if (normalizedStatus === "delivered") {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (normalizedStatus === "cancelled") {
    return "bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }

  return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
}

function getPaymentDisplay(order) {
  const paymentMethod = String(order.payment_method || "").trim();
  const paymentStatus = String(order.payment_status || "pending")
    .trim()
    .toLowerCase();

  const orderStatus = String(order.order_status || "ordered")
    .trim()
    .toLowerCase();

  const isCod = paymentMethod.toLowerCase() === "cod";

  if (isCod) {
    if (orderStatus === "delivered") {
      return {
        label: "Cash collected",
        className:
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      };
    }

    if (orderStatus === "cancelled") {
      return {
        label: "COD · no payment",
        className: "bg-muted text-muted-foreground",
      };
    }

    return {
      label: "COD",
      className: "bg-primary/10 text-primary",
    };
  }

  if (orderStatus === "cancelled" && paymentStatus === "paid") {
    return {
      label: "Paid · refund outside",
      className:
        "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    };
  }

  if (paymentStatus === "paid") {
    return {
      label: "Paid",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    };
  }

  if (paymentStatus === "failed") {
    return {
      label: "Failed",
      className: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    };
  }

  return {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  };
}

function makeOrdersUrl({ status, q }) {
  const params = new URLSearchParams();

  if (status && status !== "all") {
    params.set("status", status);
  }

  if (q) {
    params.set("q", q);
  }

  const queryString = params.toString();

  return queryString ? `/admin/orders?${queryString}` : "/admin/orders";
}

export default async function OrdersPage({ searchParams }) {
  const query = await searchParams;

  const requestedStatus = String(query?.status || "")
    .trim()
    .toLowerCase();

  const activeView = statusViews.some(
    (view) => view.key === requestedStatus
  )
    ? requestedStatus
    : "all";

  const searchTerm = String(query?.q || "").trim();

  const supabase = await createClient();

  let ordersQuery = supabase
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
        order_status,
        total_amount,
        created_at
      `
    )
    .order("created_at", { ascending: false });

  if (activeView !== "all") {
    ordersQuery = ordersQuery.eq("order_status", activeView);
  }

  if (searchTerm) {
    const safeSearchTerm = searchTerm.replace(/[%_]/g, "");

    if (safeSearchTerm) {
      ordersQuery = ordersQuery.or(
        `order_number.ilike.%${safeSearchTerm}%,customer_name.ilike.%${safeSearchTerm}%,customer_phone.ilike.%${safeSearchTerm}%`
      );
    }
  }

  const [{ data: orders, error }, { data: allOrderStatuses }] =
    await Promise.all([
      ordersQuery,
      supabase.from("orders").select("order_status"),
    ]);

  const orderList = orders || [];
  const allOrders = allOrderStatuses || [];

  const counts = {
    all: allOrders.length,
    ordered: allOrders.filter(
      (order) =>
        String(order.order_status || "ordered").toLowerCase() === "ordered"
    ).length,
    shipped: allOrders.filter(
      (order) => String(order.order_status || "").toLowerCase() === "shipped"
    ).length,
    delivered: allOrders.filter(
      (order) =>
        String(order.order_status || "").toLowerCase() === "delivered"
    ).length,
    cancelled: allOrders.filter(
      (order) =>
        String(order.order_status || "").toLowerCase() === "cancelled"
    ).length,
  };

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Process new orders, track dispatch, and confirm delivery."
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Orders" },
        ]}
      />

      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          Orders could not be loaded. Please refresh the page.
        </div>
      ) : null}

      <section className="card-surface overflow-hidden shadow-soft">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <nav
              aria-label="Order status filters"
              className="flex min-w-0 items-center gap-1 overflow-x-auto pb-1 xl:pb-0"
            >
              {statusViews.map((view) => {
                const isActive = activeView === view.key;

                return (
                  <Link
                    key={view.key}
                    href={makeOrdersUrl({
                      status: view.key,
                      q: searchTerm,
                    })}
                    className={
                      isActive
                        ? "inline-flex shrink-0 items-center gap-2 rounded-sm bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                        : "inline-flex shrink-0 items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    }
                  >
                    {view.label}

                    <span
                      className={
                        isActive
                          ? "rounded-sm bg-primary-foreground/15 px-1.5 py-0.5 text-[10px] tabular-nums"
                          : "rounded-sm bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground"
                      }
                    >
                      {counts[view.key]}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <form action="/admin/orders" className="flex w-full gap-2 xl:w-auto">
              {activeView !== "all" ? (
                <input type="hidden" name="status" value={activeView} />
              ) : null}

              <div className="relative w-full xl:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  name="q"
                  type="search"
                  defaultValue={searchTerm}
                  placeholder="Search order, customer, phone..."
                  className="h-10 w-full rounded-sm border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                />
              </div>

              <button
                type="submit"
                className="h-10 rounded-sm border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        <div className="border-b border-border bg-muted/20 px-5 py-3 sm:px-6">
          <p className="text-sm text-muted-foreground">
            {activeView === "ordered"
              ? "New orders are waiting for dispatch. Mark shipped only after handing a parcel to your courier."
              : activeView === "shipped"
                ? "Confirm delivery once the customer receives the parcel."
                : activeView === "delivered"
                  ? "Completed orders. COD payments are shown as cash collected."
                  : activeView === "cancelled"
                    ? "Cancelled orders are locked. Paid online orders may require a refund outside this system."
                    : "Click any row to open its full details. Use the right-side action to progress fulfillment."}
          </p>
        </div>

        {orderList.length ? (
          <div className="divide-y divide-border">
            {orderList.map((order) => {
              const orderStatus = String(
                order.order_status || "ordered"
              )
                .trim()
                .toLowerCase();

              const paymentDisplay = getPaymentDisplay(order);

              return (
                <div
                  key={order.id}
                  className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 transition-colors hover:bg-primary/[0.035] sm:px-6 lg:grid-cols-[minmax(220px,1.15fr)_minmax(170px,1fr)_110px_135px_105px_auto]"
                >
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex min-w-0 items-center gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    <span
                      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm ${getStatusIconClass(
                        orderStatus
                      )}`}
                    >
                      {getStatusIcon(orderStatus)}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
                        {order.order_number || "Order"}
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDateTime(order.created_at)}
                      </p>
                    </div>
                  </Link>

                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="hidden min-w-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40 lg:block"
                  >
                    <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                      {order.customer_name || "—"}
                    </p>

                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />

                      <span className="truncate">
                        {order.city || order.customer_phone || "—"}
                      </span>
                    </div>
                  </Link>

                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="hidden rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:block"
                  >
                    <StatusBadge value={orderStatus} />
                  </Link>

                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="hidden rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40 lg:block"
                  >
                    <p className="truncate text-xs font-medium text-foreground">
                      {order.payment_method || "—"}
                    </p>

                    <span
                      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${paymentDisplay.className}`}
                    >
                      {paymentDisplay.label}
                    </span>
                  </Link>

                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="hidden text-right rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:block"
                  >
                    <p className="font-semibold tabular-nums text-foreground">
                      {formatPKR(Number(order.total_amount || 0))}
                    </p>

                    <p className="mt-0.5 text-xs text-muted-foreground lg:hidden">
                      {order.customer_name || "—"}
                    </p>
                  </Link>

                  <div className="flex items-center justify-end">
                    <OrderRowAction
                      orderId={order.id}
                      currentStatus={orderStatus}
                    />
                  </div>

                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="col-span-1 flex items-center justify-between gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:hidden"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <StatusBadge value={orderStatus} />

                      <span className="truncate text-xs text-muted-foreground">
                        {order.customer_name || "—"}
                      </span>
                    </div>

                    <p className="shrink-0 font-semibold tabular-nums text-foreground">
                      {formatPKR(Number(order.total_amount || 0))}
                    </p>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-primary/10 text-primary">
              <ShoppingBag className="h-5 w-5" />
            </div>

            <h2 className="mt-4 font-semibold text-foreground">
              No matching orders
            </h2>

            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Try another status filter or adjust your search.
            </p>
          </div>
        )}
      </section>
    </>
  );
}