import { absoluteUrl } from "@/lib/utils";

type Crumb = {
  name: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.name}-${index}`} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden>/</span> : null}
              {item.href && !isLast ? (
                <a href={item.href} className="hover:text-foreground">
                  {item.name}
                </a>
              ) : (
                <span className={isLast ? "text-foreground" : undefined}>
                  {item.name}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function JsonLdScript({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function absoluteBreadcrumbItems(
  items: { name: string; path: string }[],
) {
  return items.map((item) => ({
    name: item.name,
    url: absoluteUrl(item.path),
  }));
}
