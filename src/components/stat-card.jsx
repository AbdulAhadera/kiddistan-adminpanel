import { cn } from "@/lib/utils";

const toneClasses = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  accent: "bg-accent/15 text-accent",
  info: "bg-info/10 text-info",
};

export function StatCard({
  icon,
  label,
  value,
  detail,
  tone = "primary",
  className,
}) {
  return (
    <section className={cn("card-surface p-4 shadow-soft", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">
            {label}
          </p>

          <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </p>

          {detail ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {detail}
            </p>
          ) : null}
        </div>

        {icon ? (
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-sm",
              toneClasses[tone] || toneClasses.primary
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
    </section>
  );
}