import { Button } from "@/components/ui/button";
import { completeTaskAction, deleteTaskAction } from "@/server/actions/homeowner-tasks";
import { deleteApplianceAction } from "@/server/actions/homeowner-appliances";
import { deleteDocumentAction } from "@/server/actions/homeowner-documents";
import { deletePropertyAction } from "@/server/actions/homeowner-properties";

export function CompleteTaskButton({ taskId }: { taskId: string }) {
  async function action() {
    "use server";
    await completeTaskAction(taskId);
  }
  return (
    <form action={action}>
      <Button type="submit" size="sm">
        Mark done
      </Button>
    </form>
  );
}

export function DeleteTaskButton({ taskId }: { taskId: string }) {
  async function action() {
    "use server";
    await deleteTaskAction(taskId);
  }
  return (
    <form action={action}>
      <Button type="submit" size="sm" variant="ghost">
        Delete
      </Button>
    </form>
  );
}

export function DeleteApplianceButton({ applianceId }: { applianceId: string }) {
  async function action() {
    "use server";
    await deleteApplianceAction(applianceId);
  }
  return (
    <form action={action}>
      <Button type="submit" size="sm" variant="ghost">
        Delete
      </Button>
    </form>
  );
}

export function DeleteDocumentButton({ documentId }: { documentId: string }) {
  async function action() {
    "use server";
    await deleteDocumentAction(documentId);
  }
  return (
    <form action={action}>
      <Button type="submit" size="sm" variant="ghost">
        Delete
      </Button>
    </form>
  );
}

export function DeletePropertyButton({ propertyId }: { propertyId: string }) {
  async function action() {
    "use server";
    await deletePropertyAction(propertyId);
  }
  return (
    <form action={action}>
      <Button type="submit" size="sm" variant="outline">
        Archive property
      </Button>
    </form>
  );
}
