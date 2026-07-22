import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { getPublicSiteConfig } from "@/server/services/site-settings";

export default async function AdminSettingsPage() {
  const site = await getPublicSiteConfig();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold text-primary">
          Site settings
        </h2>
        <p className="mt-2 text-muted-foreground">
          Branding and feature toggles stored in the database.
        </p>
      </div>
      <SiteSettingsForm
        siteName={site.name}
        siteTagline={site.tagline}
        supportEmail={site.supportEmail}
        reviewsEnabled={site.reviewsEnabled}
      />
    </div>
  );
}
