import { NextResponse } from "next/server";

import { AuthError } from "@/lib/auth-guards";
import { getOwnedDocumentBinary } from "@/server/services/homeowner-documents";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const result = await getOwnedDocumentBinary(id);
    if (result.redirectUrl) {
      return NextResponse.redirect(result.redirectUrl);
    }
    return new NextResponse(new Uint8Array(result.buffer!), {
      headers: {
        "Content-Type": result.doc.mimeType,
        "Content-Disposition": `attachment; filename="${result.doc.fileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
