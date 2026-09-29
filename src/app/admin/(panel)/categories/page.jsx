import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, slug, is_active, sort_order")
    .order("sort_order", { ascending: true });

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle={`${categories?.length || 0} categories`}
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Categories" },
        ]}
      />

      {error ? (
        <div className="rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Categories could not be loaded.
        </div>
      ) : (
        <div className="card-surface p-5 shadow-soft">
          {categories?.length ? (
            <ul className="space-y-3">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {category.name}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      /{category.slug}
                    </p>
                  </div>

                  <span className="text-xs text-muted-foreground">
                    {category.is_active ? "Active" : "Inactive"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No categories found.
            </p>
          )}
        </div>
      )}
    </>
  );
}