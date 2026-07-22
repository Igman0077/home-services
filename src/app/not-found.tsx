import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-start px-4 py-24 sm:px-6">
      <p className="text-sm font-semibold text-accent">404</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-primary">
        Page not found
      </h1>
      <p className="mt-3 text-muted-foreground">
        The page you requested does not exist or is not published yet.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
