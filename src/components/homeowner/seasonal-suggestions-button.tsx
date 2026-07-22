import { Button } from "@/components/ui/button";
import { addSeasonalSuggestionsAction } from "@/server/actions/homeowner-tasks";

export function SeasonalSuggestionsButton({
  propertyId,
}: {
  propertyId?: string;
}) {
  async function action() {
    "use server";
    await addSeasonalSuggestionsAction(propertyId);
  }

  return (
    <form action={action}>
      <Button type="submit" variant="outline" size="sm">
        Add Northern NY seasonal suggestions
      </Button>
    </form>
  );
}
