import { NextResponse } from "next/server";

import { getPaymentProvider } from "@/integrations/payments";
import { processPaymentWebhookEvent } from "@/server/services/payment-webhooks";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const provider = getPaymentProvider();
  const rawBody = await request.text();

  try {
    if (provider.name === "stripe" && provider.constructWebhookEvent) {
      const signature = request.headers.get("stripe-signature");
      if (!signature) {
        return NextResponse.json(
          { error: "Missing stripe-signature" },
          { status: 400 },
        );
      }
      const event = await provider.constructWebhookEvent(rawBody, signature);
      await processPaymentWebhookEvent({
        provider: "stripe",
        eventId: event.id,
        type: event.type,
        payload: (event.data as { object?: unknown }).object
          ? event.data
          : { object: event.data },
      });
      return NextResponse.json({ received: true });
    }

    // Mock webhook for local testing
    const json = JSON.parse(rawBody) as {
      id?: string;
      type?: string;
      data?: unknown;
    };
    if (!json.id || !json.type) {
      return NextResponse.json(
        { error: "Expected { id, type, data }" },
        { status: 400 },
      );
    }
    await processPaymentWebhookEvent({
      provider: "mock",
      eventId: json.id,
      type: json.type,
      payload: json.data ?? {},
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Webhook processing failed",
      },
      { status: 400 },
    );
  }
}
