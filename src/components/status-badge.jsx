import { Badge } from "@/components/ui/badge";
import { titleCase } from "@/lib/utils";

const orderStatusTones = {
  ordered: "info",
  shipped: "primary",
  delivered: "success",
  cancelled: "destructive",
};

const productStatusTones = {
  active: "success",
  draft: "warning",
  archived: "default",
  inactive: "default",
};

export function StatusBadge({
  value,
  kind = "order",
  className,
}) {
  const normalizedValue = String(value || "").toLowerCase();

  const tone =
    kind === "product"
      ? productStatusTones[normalizedValue] || "default"
      : orderStatusTones[normalizedValue] || "default";

  return (
    <Badge tone={tone} className={className}>
      {titleCase(normalizedValue || "unknown")}
    </Badge>
  );
}