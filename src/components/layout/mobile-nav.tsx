"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/services", label: "Services" },
  { href: "/locations", label: "Locations" },
  { href: "/businesses", label: "Businesses" },
  { href: "/guides", label: "Guides" },
  { href: "/calculators", label: "Calculators" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Close" : "Menu"}
      </Button>
      {open ? (
        <div
          id={panelId}
          className="absolute inset-x-0 top-16 z-40 border-b border-border bg-background px-4 py-4 shadow-sm"
        >
          <nav aria-label="Mobile primary" className="flex flex-col gap-2">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/request-a-quote"
              className="rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground"
              onClick={() => setOpen(false)}
            >
              Request a quote
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
