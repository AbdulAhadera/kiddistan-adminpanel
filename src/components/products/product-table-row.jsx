"use client";

import { useRouter } from "next/navigation";
import { Eye, Package, Pencil } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatNumber, formatPKR } from "@/lib/utils";

export function ProductTableRow({
  product,
  categoryName,
  stock,
  viewCount,
}) {
  const router = useRouter();

  function openProduct() {
    router.push(`/admin/products/${product.id}`);
  }

  function handleRowKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProduct();
    }
  }

  function handleEditClick(event) {
    event.preventDefault();
    event.stopPropagation();

    router.push(`/admin/products/${product.id}/edit`);
  }

  return (
    <TableRow
      tabIndex={0}
      role="link"
      aria-label={`Open ${product.name}`}
      onClick={openProduct}
      onKeyDown={handleRowKeyDown}
      className="cursor-pointer transition-colors hover:bg-primary/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <TableCell>
        <div className="h-11 w-11 overflow-hidden rounded-sm bg-muted">
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
            <span className="flex h-full w-full items-center justify-center">
              <Package className="h-4 w-4 text-muted-foreground" />
            </span>
          )}
        </div>
      </TableCell>

      <TableCell>
        <p className="max-w-64 truncate font-medium text-foreground">
          {product.name}
        </p>

        <p className="mt-0.5 max-w-64 truncate font-mono text-xs text-muted-foreground">
          /{product.slug}
        </p>
      </TableCell>

      <TableCell className="hidden md:table-cell">
        <div className="inline-flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />

          <span className="text-sm font-medium tabular-nums text-foreground">
            {formatNumber(viewCount)}
          </span>
        </div>
      </TableCell>

      <TableCell className="hidden text-muted-foreground lg:table-cell">
        {categoryName}
      </TableCell>

      <TableCell className="text-right font-medium tabular-nums text-foreground">
        {formatPKR(Number(product.price || 0))}
      </TableCell>

      <TableCell className="hidden sm:table-cell">
        <p
          className={
            stock.totalStock === 0
              ? "font-medium tabular-nums text-destructive"
              : stock.totalStock <= 4
                ? "font-medium tabular-nums text-warning"
                : "font-medium tabular-nums text-foreground"
          }
        >
          {stock.totalStock} units
        </p>

        <p className="text-xs text-muted-foreground">
          {stock.sizeCount} size{stock.sizeCount === 1 ? "" : "s"}
        </p>
      </TableCell>

      <TableCell>
        <StatusBadge kind="product" value={product.status} />
      </TableCell>

      <TableCell className="text-right">
        <button
          type="button"
          onClick={handleEditClick}
          aria-label={`Edit ${product.name}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </TableCell>
    </TableRow>
  );
}