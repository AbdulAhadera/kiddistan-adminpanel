"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  LoaderCircle,
  Truck,
} from "lucide-react";

import { updateOrderStatus } from "@/app/admin/(panel)/orders/actions";

export function OrderRowAction({ orderId, currentStatus }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const normalizedStatus = String(currentStatus || "ordered")
    .trim()
    .toLowerCase();

  const nextStatus =
    normalizedStatus === "ordered"
      ? "shipped"
      : normalizedStatus === "shipped"
        ? "delivered"
        : null;

  if (!nextStatus) {
    return null;
  }

  const isShipping = nextStatus === "shipped";

  function handleClick(event) {
    event.preventDefault();
    event.stopPropagation();

    setError("");

    startTransition(async () => {
      const result = await updateOrderStatus(orderId, nextStatus);

      if (!result.ok) {
        setError(result.message || "Status could not be updated.");
      }
    });
  }

  return (
    <div
      className="flex flex-col items-end gap-1"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={
          isShipping
            ? "inline-flex h-8 items-center justify-center gap-1.5 rounded-sm bg-blue-600 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            : "inline-flex h-8 items-center justify-center gap-1.5 rounded-sm bg-emerald-600 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {isPending ? (
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
        ) : isShipping ? (
          <Truck className="h-3.5 w-3.5" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5" />
        )}

        {isPending
          ? "Updating..."
          : isShipping
            ? "Mark shipped"
            : "Mark delivered"}
      </button>

      {error ? (
        <span className="max-w-40 text-right text-[10px] leading-4 text-destructive">
          {error}
        </span>
      ) : null}
    </div>
  );
}