import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  MapPin,
  MessageCircle,
  Package,
  PackageCheck,
  Phone,
  ReceiptText,
  Truck,
  User,
  XCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, formatPKR, titleCase } from "@/lib/utils";
import {
  cancelOrder,
  updateOrderStatus,
  updatePaymentStatus,
} from "../actions";

export const dynamic = "force-dynamic";

/* -------------------------------------------------------------------------- */
/* Server actions                                                             */
/* -------------------------------------------------------------------------- */

async function handleOrderStatusUpdate(formData) {
  "use server";

  const orderId = String(formData.get("orderId") || "");
  const nextStatus = String(formData.get("nextStatus") || "");

  const result = await updateOrderStatus(orderId, nextStatus);

  if (!result.ok) {
    redirect(
      `/admin/orders/${orderId}?error=${encodeURIComponent(
        result.message || "Order status could not be updated."
      )}`
    );
  }

  redirect(`/admin/orders/${orderId}?updated=${result.status}`);
}

async function handlePaymentStatusUpdate(formData) {
  "use server";

  const orderId = String(formData.get("orderId") || "");
  const nextPaymentStatus = String(formData.get("nextPaymentStatus") || "");

  const result = await updatePaymentStatus(orderId, nextPaymentStatus);

  if (!result.ok) {
    redirect(
      `/admin/orders/${orderId}?error=${encodeURIComponent(
        result.message || "Payment status could not be updated."
      )}`
    );
  }

  redirect(`/admin/orders/${orderId}?paymentUpdated=${result.paymentStatus}`);
}

async function handleCancelOrder(formData) {
  "use server";

  const orderId = String(formData.get("orderId") || "");
  const reason = String(formData.get("cancellationReason") || "").trim();
  const details = String(formData.get("cancellationDetails") || "").trim();

  // Details are optional, except when "Other" is chosen.
  if (reason === "Other" && !details) {
    redirect(
      `/admin/orders/${orderId}?error=${encodeURIComponent(
        "Add a short note explaining why the order is being cancelled."
      )}`
    );
  }

  const fullReason = details ? `${reason}: ${details}` : reason;
  const result = await cancelOrder(orderId, fullReason);

  if (!result.ok) {
    redirect(
      `/admin/orders/${orderId}?error=${encodeURIComponent(
        result.message || "Order could not be cancelled."
      )}`
    );
  }

  redirect(`/admin/orders/${orderId}?updated=cancelled`);
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const SUCCESS_MESSAGES = {
  updated: {
    shipped: "Order marked as shipped.",
    delivered: "Order marked as delivered.",
    cancelled: "Order cancelled.",
  },
  paymentUpdated: {
    paid: "Payment marked as received.",
    failed: "Payment marked as failed.",
  },
};

const CANCEL_REASONS = {
  ordered: [
    "Customer requested cancellation",
    "Payment could not be verified",
    "Item is unavailable",
    "Incorrect order details",
    "Other",
  ],
  shipped: [
    "Customer requested cancellation",
    "Parcel returned or refused",
    "Delivery issue",
    "Incorrect order details",
    "Other",
  ],
};

function getSuccessMessage(query) {
  return (
    SUCCESS_MESSAGES.updated[query?.updated] ||
    SUCCESS_MESSAGES.paymentUpdated[query?.paymentUpdated] ||
    null
  );
}

function getOnlinePaymentTone(paymentStatus) {
  if (paymentStatus === "paid") return "bg-success/10 text-success";
  if (paymentStatus === "failed") return "bg-destructive/10 text-destructive";
  return "bg-warning/10 text-warning";
}

/** Converts 03xx… / +92… into digits-only international format for wa.me */
function toWhatsAppNumber(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("92")) return digits;
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  return digits;
}

function mapsUrl(address, city) {
  const q = [address, city, "Pakistan"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    q
  )}`;
}

/* -------------------------------------------------------------------------- */
/* Small presentational pieces                                                */
/* -------------------------------------------------------------------------- */

function SubmitButton({ children, className = "" }) {
  return (
    <button
      type="submit"
      className={`inline-flex items-center justify-center gap-2 rounded-sm text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${className}`}
    >
      {children}
    </button>
  );
}

function Card({ icon: Icon, title, action, children, className = "" }) {
  return (
    <section className={`card-surface overflow-hidden shadow-soft ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {Icon ? <Icon className="h-4 w-4 text-primary" /> : null}
          {title}
        </h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-foreground">
        {children}
      </dd>
    </div>
  );
}

function Banner({ tone, children, dismissHref }) {
  const tones = {
    success: "border-success/25 bg-success/10 text-success",
    error: "border-destructive/25 bg-destructive/10 text-destructive",
  };

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`mb-4 flex items-start gap-2 rounded-sm border px-3 py-2 text-sm ${tones[tone]}`}
    >
      {tone === "error" ? (
        <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <p className="flex-1 font-medium">{children}</p>
      <Link
        href={dismissHref}
        scroll={false}
        aria-label="Dismiss message"
        className="rounded-sm p-0.5 opacity-70 hover:opacity-100"
      >
        <XCircle className="h-4 w-4" />
      </Link>
    </div>
  );
}

/** Horizontal tracker: Ordered → Shipped → Delivered, joined by a line. */
function StatusTracker({ currentStatus }) {
  const steps = [
    { key: "ordered", label: "Ordered", icon: Clock3 },
    { key: "shipped", label: "Shipped", icon: Truck },
    { key: "delivered", label: "Delivered", icon: PackageCheck },
  ];
  const currentIndex = steps.findIndex((s) => s.key === currentStatus);

  return (
    <ol className="flex items-start" aria-label="Order progress">
      {steps.map((step, index) => {
        const done = index < currentIndex || currentStatus === "delivered";
        const current = index === currentIndex && currentStatus !== "delivered";
        const reached = done || current;
        const Icon = step.icon;

        return (
          <li
            key={step.key}
            aria-current={current ? "step" : undefined}
            className="relative flex flex-1 flex-col items-center text-center"
          >
            {index > 0 ? (
              <span
                aria-hidden
                className={`absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${
                  reached ? "bg-primary" : "bg-border"
                }`}
              />
            ) : null}

            <span
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                done
                  ? "border-primary bg-primary text-primary-foreground"
                  : current
                    ? "border-primary bg-background text-primary ring-4 ring-primary/15"
                    : "border-border bg-background text-muted-foreground"
              }`}
            >
              {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </span>

            <span
              className={`mt-2 text-xs font-semibold ${
                reached ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function CancelOrderForm({ orderId, status, isCod, isPaid }) {
  const reasons = CANCEL_REASONS[status] || CANCEL_REASONS.ordered;
  const selectId = `cancellationReason-${status}`;
  const detailsId = `cancellationDetails-${status}`;

  const paymentNote = isCod
    ? "COD order: no payment will be collected."
    : isPaid
      ? "Payment is already marked paid. Process any refund outside this system."
      : "Pending online payment will be marked failed.";

  return (
    <details className="group rounded-sm">
      <summary className="flex h-10 cursor-pointer list-none items-center justify-center gap-2 rounded-sm border border-destructive/25 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30 group-open:bg-destructive/10 [&::-webkit-details-marker]:hidden">
        <XCircle className="h-4 w-4" />
        Cancel order
      </summary>

      <form
        action={handleCancelOrder}
        className="mt-2 space-y-3 rounded-sm border border-destructive/20 bg-destructive/[0.04] p-3"
      >
        <input type="hidden" name="orderId" value={orderId} />

        <div>
          <label htmlFor={selectId} className="text-xs font-medium text-foreground">
            Reason <span className="text-destructive">*</span>
          </label>
          <select
            id={selectId}
            name="cancellationReason"
            required
            defaultValue=""
            className="mt-1.5 flex h-9 w-full rounded-sm border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <option value="" disabled>
              Select a reason
            </option>
            {reasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={detailsId} className="text-xs font-medium text-foreground">
            Note <span className="font-normal text-muted-foreground">(required for “Other”)</span>
          </label>
          <textarea
            id={detailsId}
            name="cancellationDetails"
            rows={2}
            maxLength={300}
            className="mt-1.5 w-full resize-none rounded-sm border border-input bg-background px-2.5 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>

        <ul className="space-y-1.5 text-xs leading-5 text-muted-foreground">
          <li>{paymentNote}</li>
          <li>
            Stock is not restocked automatically. Update inventory manually if
            needed.
          </li>
          <li className="font-medium text-foreground">
            This can’t be undone.
          </li>
        </ul>

        <SubmitButton
          className="h-9 w-full bg-destructive px-3 text-destructive-foreground hover:bg-destructive/90"
        >
          <XCircle className="h-4 w-4" />
          Confirm cancellation
        </SubmitButton>
      </form>
    </details>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function OrderDetailPage({ params, searchParams }) {
  const { id } = await params;
  const query = await searchParams;

  const successMessage = getSuccessMessage(query);
  const errorMessage = query?.error || null;

  const supabase = await createClient();

  const [orderResult, itemsResult] = await Promise.all([
    supabase
      .from("orders")
      .select(
        `
          id,
          order_number,
          customer_name,
          customer_phone,
          customer_email,
          shipping_address,
          city,
          payment_method,
          payment_status,
          order_status,
          total_amount,
          notes,
          created_at,
          updated_at
        `
      )
      .eq("id", id)
      .maybeSingle(),

    supabase
      .from("order_items")
      .select(
        `
          id,
          product_id,
          size_label,
          quantity,
          unit_price,
          products (
            id,
            name,
            primary_image,
            slug
          )
        `
      )
      .eq("order_id", id),
  ]);

  if (orderResult.error) console.error("Order load error:", orderResult.error);
  if (itemsResult.error) console.error("Order items load error:", itemsResult.error);

  const order = orderResult.data;
  if (!order) notFound();

  const items = itemsResult.data || [];
  const totalAmount = Number(order.total_amount || 0);
  const itemsSubtotal = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
    0
  );
  const otherCharges = totalAmount - itemsSubtotal; // shipping, discounts, etc.

  const currentStatus = String(order.order_status || "ordered").trim().toLowerCase();
  const paymentStatus = String(order.payment_status || "pending").trim().toLowerCase();
  const paymentMethod = String(order.payment_method || "").trim();

  const isCod = paymentMethod.toLowerCase() === "cod";
  const isPaid = paymentStatus === "paid";
  const isCancelled = currentStatus === "cancelled";
  const isDelivered = currentStatus === "delivered";

  const whatsapp = toWhatsAppNumber(order.customer_phone);

  return (
    <>

      <PageHeader
        title={order.order_number || "Order"}
        subtitle={`Placed ${formatDateTime(order.created_at)}`}
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Orders", href: "/admin/orders" },
          { label: order.order_number || "Order" },
        ]}
      >
        <div className="flex items-center gap-2">
          <StatusBadge value={currentStatus} />
        </div>
      </PageHeader>

      {/* Feedback is shown at the top so it's never missed */}
      {successMessage ? <Banner tone="success" dismissHref={`/admin/orders/${order.id}`}>{successMessage}</Banner> : null}
      {errorMessage ? <Banner tone="error" dismissHref={`/admin/orders/${order.id}`}>{errorMessage}</Banner> : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* ------------------------------ Left column ----------------------------- */}
        <main className="space-y-4">
          <section className="card-surface overflow-hidden shadow-soft">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
              <ReceiptText className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Order items</h2>
              <span className="text-xs text-muted-foreground">
                ({items.length})
              </span>
            </div>

            {items.length ? (
              <ul className="divide-y divide-border">
                {items.map((item) => {
                  const quantity = Number(item.quantity || 0);
                  const unitPrice = Number(item.unit_price || 0);

                  return (
                    <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-muted">
                        {item.products?.primary_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.products.primary_image}
                            alt={item.products.name || "Product image"}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <Package className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        {item.products?.id ? (
                          <Link
                            href={`/admin/products/${item.products.id}`}
                            className="block truncate font-medium text-foreground transition-colors hover:text-primary"
                          >
                            {item.products.name || "Product"}
                          </Link>
                        ) : (
                          <p className="truncate font-medium text-muted-foreground">
                            Product no longer available
                          </p>
                        )}

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <span className="rounded-sm bg-muted px-1.5 py-0.5 font-medium text-foreground">
                            Size {item.size_label || "—"}
                          </span>
                          <span className="tabular-nums">
                            {quantity} × {formatPKR(unitPrice)}
                          </span>
                        </div>
                      </div>

                      <p className="shrink-0 text-right font-semibold tabular-nums text-foreground">
                        {formatPKR(quantity * unitPrice)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-5 py-10 text-center">
                <Package className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  No items found
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  This order has no line items. Check the database record.
                </p>
              </div>
            )}

            <dl className="space-y-2 border-t border-border bg-muted/30 px-5 py-4 text-sm">
              {Math.abs(otherCharges) > 0.5 ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="tabular-nums text-foreground">
                    {formatPKR(itemsSubtotal)}
                  </dd>
                </div>
              ) : null}

              {Math.abs(otherCharges) > 0.5 ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    {otherCharges > 0 ? "Shipping & fees" : "Discounts"}
                  </dt>
                  <dd className="tabular-nums text-foreground">
                    {otherCharges > 0 ? "" : "−"}
                    {formatPKR(Math.abs(otherCharges))}
                  </dd>
                </div>
              ) : null}

              <div
                className={`flex items-center justify-between ${
                  Math.abs(otherCharges) > 0.5 ? "border-t border-border pt-3" : ""
                }`}
              >
                <dt className="font-medium text-foreground">Total</dt>
                <dd className="text-lg font-semibold tabular-nums text-foreground">
                  {formatPKR(totalAmount)}
                </dd>
              </div>
            </dl>
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Customer */}
          <Card icon={User} title="Customer">
            <p className="text-sm font-medium text-foreground">
              {order.customer_name || "—"}
            </p>

            <div className="mt-3 space-y-2 text-sm">
              {order.customer_phone ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2 text-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <a
                      href={`tel:${order.customer_phone}`}
                      className="truncate hover:text-primary"
                    >
                      {order.customer_phone}
                    </a>
                  </span>

                  <span className="flex shrink-0 items-center">
                    {whatsapp ? (
                      <a
                        href={`https://wa.me/${whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Message on WhatsApp"
                        title="Message on WhatsApp"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-success focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </span>
                </div>
              ) : (
                <p className="text-muted-foreground">No phone number</p>
              )}

              {order.customer_email ? (
                <a
                  href={`mailto:${order.customer_email}`}
                  className="block break-all text-foreground hover:text-primary"
                >
                  {order.customer_email}
                </a>
              ) : null}
            </div>
          </Card>

          {/* Delivery */}
          <Card
            icon={MapPin}
            title="Delivery"
            action={
              order.shipping_address ? (
                <a
                  href={mapsUrl(order.shipping_address, order.city)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-sm text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  View map
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null
            }
          >
            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
              {order.shipping_address || "No address provided"}
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {order.city || "—"}
            </p>
          </Card>

          </div>

          {order.notes ? (
            <Card title="Order notes">
              <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {order.notes}
              </p>
            </Card>
          ) : null}
        </main>

        {/* ------------------------------ Right column ---------------------------- */}
        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          {/* Fulfillment */}
          <Card
            icon={Truck}
            title="Fulfillment"
          >
            {isCancelled ? (
              <div className="rounded-sm border border-destructive/25 bg-destructive/10 px-4 py-4 text-center">
                <XCircle className="mx-auto h-5 w-5 text-destructive" />
                <p className="mt-2 text-sm font-semibold text-destructive">
                  Order cancelled
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  The reason is saved in order notes. This order is locked.
                </p>
              </div>
            ) : (
              <StatusTracker currentStatus={currentStatus} />
            )}

            {currentStatus === "ordered" || currentStatus === "shipped" ? (
              <div className="mt-5 space-y-2">
                <form action={handleOrderStatusUpdate}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <input
                    type="hidden"
                    name="nextStatus"
                    value={currentStatus === "ordered" ? "shipped" : "delivered"}
                  />

                  {currentStatus === "ordered" ? (
                    <SubmitButton
                      className="h-10 w-full bg-primary px-4 text-primary-foreground hover:bg-primary/90"
                    >
                      <Truck className="h-4 w-4" />
                      Mark as shipped
                    </SubmitButton>
                  ) : (
                    <SubmitButton
                      className="h-10 w-full bg-emerald-600 px-4 text-white hover:bg-emerald-700"
                    >
                      <PackageCheck className="h-4 w-4" />
                      Mark as delivered
                    </SubmitButton>
                  )}
                </form>

                {isCod && currentStatus === "shipped" ? (
                  <p className="text-xs leading-5 text-muted-foreground">
                    Marking as delivered also records the COD payment as
                    collected.
                  </p>
                ) : null}

                <CancelOrderForm
                  orderId={order.id}
                  status={currentStatus}
                  isCod={isCod}
                  isPaid={isPaid}
                />
              </div>
            ) : null}

            {isDelivered ? (
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Completed. This order is locked.
              </p>
            ) : null}
          </Card>

          {/* Payment */}
          <Card
            icon={CreditCard}
            title="Payment"
            action={
              isCod ? (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isDelivered
                      ? "bg-success/10 text-success"
                      : isCancelled
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/10 text-primary"
                  }`}
                >
                  {isDelivered
                    ? "Cash collected"
                    : isCancelled
                      ? "No payment"
                      : "Pay on delivery"}
                </span>
              ) : (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getOnlinePaymentTone(
                    paymentStatus
                  )}`}
                >
                  {titleCase(paymentStatus)}
                </span>
              )
            }
          >
            <dl className="space-y-2">
              <Field label="Method">{paymentMethod || "—"}</Field>
            </dl>

            {isCod ? (
              <p className="mt-4 rounded-sm bg-primary/5 px-3 py-3 text-xs leading-5 text-muted-foreground">
                {isDelivered
                  ? "Cash was collected on delivery."
                  : isCancelled
                    ? "No payment was collected for this cancelled order."
                    : "Ask the courier to collect cash. Payment is recorded automatically when you mark the order delivered."}
              </p>
            ) : isCancelled ? (
              <p className="mt-4 rounded-sm bg-muted px-3 py-3 text-xs leading-5 text-muted-foreground">
                {isPaid
                  ? "Payment was received. Process any refund outside this system."
                  : "Payment was not collected."}
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {!isPaid ? (
                  <form action={handlePaymentStatusUpdate}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="nextPaymentStatus" value="paid" />
                    <SubmitButton
                      className="h-10 w-full bg-success px-4 text-success-foreground hover:bg-success/90"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark payment received
                    </SubmitButton>
                  </form>
                ) : (
                  <p className="flex items-center gap-2 rounded-sm bg-success/10 px-3 py-2.5 text-xs font-medium text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    Payment received
                  </p>
                )}

                {paymentStatus === "pending" ? (
                  <form action={handlePaymentStatusUpdate}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="nextPaymentStatus" value="failed" />
                    <SubmitButton
                      className="h-10 w-full border border-destructive/25 px-4 font-medium text-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="h-4 w-4" />
                      Mark payment failed
                    </SubmitButton>
                  </form>
                ) : null}
              </div>
            )}
          </Card>

          {/* Record */}
          <Card title="Order record">
            <dl className="space-y-2">
              <Field label="Placed">{formatDateTime(order.created_at)}</Field>
              <Field label="Last updated">{formatDateTime(order.updated_at)}</Field>
            </dl>
          </Card>
        </aside>
      </div>
    </>
  );
}