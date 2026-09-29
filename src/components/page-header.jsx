import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  breadcrumb = [],
  action,
  children,
  className,
}) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        {breadcrumb.length ? (
          <nav
            aria-label="Breadcrumb"
            className="mb-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
          >
            {breadcrumb.map((item, index) => (
              <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
                {index > 0 ? <span aria-hidden="true">/</span> : null}

                {item.href ? (
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-primary"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-foreground">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}

        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>

        {subtitle ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {children}

        {action ? (
          action.href ? (
            <Link
              href={action.href}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-sm bg-primary px-3.5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {action.icon}
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-sm bg-primary px-3.5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {action.icon}
              {action.label}
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}

export function BackLink({ href, label = "Back", className }) {
  return (
    <Link
      href={href}
      className={cn(
        "mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}