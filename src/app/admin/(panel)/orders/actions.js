"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const VALID_ORDER_STATUSES = [
  "ordered",
  "shipped",
  "delivered",
  "cancelled",
];

const VALID_PAYMENT_STATUSES = ["pending", "paid", "failed"];

const ALLOWED_ORDER_TRANSITIONS = {
  ordered: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalize(value) {
  return cleanText(value).toLowerCase();
}

function isCOD(paymentMethod) {
  return normalize(paymentMethod) === "cod";
}

function revalidateOrderPaths(orderId) {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      message: "You are not signed in.",
      supabase: null,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return {
      ok: false,
      message: "You are not authorized to manage orders.",
      supabase: null,
    };
  }

  return {
    ok: true,
    supabase,
  };
}

async function getOrderForUpdate(supabase, orderId) {
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
        id,
        payment_method,
        payment_status,
        order_status,
        notes
      `
    )
    .eq("id", orderId)
    .single();

  if (error || !order) {
    console.error("getOrderForUpdate error:", error);

    return {
      ok: false,
      message: "Order was not found.",
      order: null,
    };
  }

  return {
    ok: true,
    order,
  };
}

export async function updateOrderStatus(orderId, nextStatus) {
  const normalizedOrderId = cleanText(orderId);
  const normalizedNextStatus = normalize(nextStatus);

  if (!normalizedOrderId) {
    return {
      ok: false,
      message: "Order ID is required.",
    };
  }

  if (!VALID_ORDER_STATUSES.includes(normalizedNextStatus)) {
    return {
      ok: false,
      message: "Invalid order status.",
    };
  }

  const auth = await requireAdmin();

  if (!auth.ok) {
    return {
      ok: false,
      message: auth.message,
    };
  }

  const { supabase } = auth;

  const lookup = await getOrderForUpdate(supabase, normalizedOrderId);

  if (!lookup.ok) {
    return {
      ok: false,
      message: lookup.message,
    };
  }

  const order = lookup.order;
  const currentStatus = normalize(order.order_status) || "ordered";

  if (
    !ALLOWED_ORDER_TRANSITIONS[currentStatus]?.includes(
      normalizedNextStatus
    )
  ) {
    return {
      ok: false,
      message: `This order cannot move from ${currentStatus} to ${normalizedNextStatus}.`,
    };
  }

  const updatePayload = {
    order_status: normalizedNextStatus,
  };

  if (
    normalizedNextStatus === "delivered" &&
    isCOD(order.payment_method) &&
    normalize(order.payment_status) === "pending"
  ) {
    updatePayload.payment_status = "paid";
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update(updatePayload)
    .eq("id", normalizedOrderId);

  if (updateError) {
    console.error("updateOrderStatus error:", updateError);

    return {
      ok: false,
      message: "Order status could not be updated. Please try again.",
    };
  }

  revalidateOrderPaths(normalizedOrderId);

  return {
    ok: true,
    status: normalizedNextStatus,
  };
}

export async function updatePaymentStatus(orderId, nextPaymentStatus) {
  const normalizedOrderId = cleanText(orderId);
  const normalizedPaymentStatus = normalize(nextPaymentStatus);

  if (!normalizedOrderId) {
    return {
      ok: false,
      message: "Order ID is required.",
    };
  }

  if (!VALID_PAYMENT_STATUSES.includes(normalizedPaymentStatus)) {
    return {
      ok: false,
      message: "Invalid payment status.",
    };
  }

  const auth = await requireAdmin();

  if (!auth.ok) {
    return {
      ok: false,
      message: auth.message,
    };
  }

  const { supabase } = auth;

  const lookup = await getOrderForUpdate(supabase, normalizedOrderId);

  if (!lookup.ok) {
    return {
      ok: false,
      message: lookup.message,
    };
  }

  const order = lookup.order;
  const orderStatus = normalize(order.order_status) || "ordered";

  if (isCOD(order.payment_method)) {
    return {
      ok: false,
      message:
        "COD payment is marked paid automatically when you mark the order delivered.",
    };
  }

  if (orderStatus === "cancelled" && normalizedPaymentStatus === "paid") {
    return {
      ok: false,
      message: "A cancelled order cannot be marked as paid.",
    };
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      payment_status: normalizedPaymentStatus,
    })
    .eq("id", normalizedOrderId);

  if (updateError) {
    console.error("updatePaymentStatus error:", updateError);

    return {
      ok: false,
      message: "Payment status could not be updated. Please try again.",
    };
  }

  revalidateOrderPaths(normalizedOrderId);

  return {
    ok: true,
    paymentStatus: normalizedPaymentStatus,
  };
}

export async function cancelOrder(orderId, cancellationReason) {
  const normalizedOrderId = cleanText(orderId);
  const normalizedReason = cleanText(cancellationReason);

  if (!normalizedOrderId) {
    return {
      ok: false,
      message: "Order ID is required.",
    };
  }

  if (!normalizedReason) {
    return {
      ok: false,
      message: "Please select a cancellation reason.",
    };
  }

  const auth = await requireAdmin();

  if (!auth.ok) {
    return {
      ok: false,
      message: auth.message,
    };
  }

  const { supabase } = auth;

  const lookup = await getOrderForUpdate(supabase, normalizedOrderId);

  if (!lookup.ok) {
    return {
      ok: false,
      message: lookup.message,
    };
  }

  const order = lookup.order;
  const currentOrderStatus = normalize(order.order_status) || "ordered";
  const currentPaymentStatus = normalize(order.payment_status) || "pending";

  if (!["ordered", "shipped"].includes(currentOrderStatus)) {
    return {
      ok: false,
      message: "Only ordered or shipped orders can be cancelled.",
    };
  }

  const cancellationNote = `[Cancelled: ${normalizedReason}]`;
  const existingNotes = cleanText(order.notes);

  const updatePayload = {
    order_status: "cancelled",
    notes: existingNotes
      ? `${existingNotes}\n\n${cancellationNote}`
      : cancellationNote,
  };

  /*
    COD:
    keep payment status pending. The UI shows “COD · no payment”.

    Online pending:
    mark failed, because it was not collected.

    Online paid:
    leave as paid; current schema has no refunded state.
  */
  if (!isCOD(order.payment_method) && currentPaymentStatus === "pending") {
    updatePayload.payment_status = "failed";
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update(updatePayload)
    .eq("id", normalizedOrderId);

  if (updateError) {
    console.error("cancelOrder error:", updateError);

    return {
      ok: false,
      message: "Order could not be cancelled. Please try again.",
    };
  }

  revalidateOrderPaths(normalizedOrderId);

  return {
    ok: true,
    status: "cancelled",
    paymentStatus: updatePayload.payment_status || currentPaymentStatus,
  };
}