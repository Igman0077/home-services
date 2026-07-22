import { Button } from "@/components/ui/button";
import { reviewAiGenerationAction } from "@/server/actions/ai-content";
import { transitionGuideStatusAction } from "@/server/actions/content-guides";
import type { PublishStatus } from "@prisma/client";

export function AiReviewButtons({ generationId }: { generationId: string }) {
  async function approve() {
    "use server";
    await reviewAiGenerationAction(generationId, "APPROVED");
  }
  async function revise() {
    "use server";
    await reviewAiGenerationAction(generationId, "NEEDS_REVISION");
  }
  async function reject() {
    "use server";
    await reviewAiGenerationAction(generationId, "REJECTED");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <form action={approve}>
        <Button type="submit" size="sm">
          Approve → create draft guide
        </Button>
      </form>
      <form action={revise}>
        <Button type="submit" size="sm" variant="outline">
          Needs revision
        </Button>
      </form>
      <form action={reject}>
        <Button type="submit" size="sm" variant="ghost">
          Reject
        </Button>
      </form>
    </div>
  );
}

export function GuideStatusButton({
  guideId,
  status,
  label,
}: {
  guideId: string;
  status: PublishStatus;
  label: string;
}) {
  async function action() {
    "use server";
    await transitionGuideStatusAction(guideId, status);
  }
  return (
    <form action={action}>
      <Button type="submit" size="sm" variant="outline">
        {label}
      </Button>
    </form>
  );
}
