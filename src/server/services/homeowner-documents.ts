import { getStorageProvider } from "@/integrations/storage";
import { AuthError } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { requireHomeownerSession } from "@/server/services/homeowner-guard";

export async function getOwnedDocumentBinary(documentId: string) {
  const session = await requireHomeownerSession();
  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId: session.user.id },
  });
  if (!doc) throw new AuthError("Document not found.");

  if (doc.storageKey.startsWith("external:")) {
    return {
      doc,
      redirectUrl: doc.storageKey.slice("external:".length),
      buffer: null as Buffer | null,
    };
  }

  const buffer = await getStorageProvider().get(doc.storageKey);
  if (!buffer) throw new AuthError("File missing from storage.");
  return { doc, buffer, redirectUrl: null as string | null };
}
