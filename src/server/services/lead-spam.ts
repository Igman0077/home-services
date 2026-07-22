import { createHash } from "node:crypto";

import { prisma } from "@/lib/db";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;
const MIN_FORM_SECONDS = 4;

type SpamCheckInput = {
  email: string;
  phone?: string | null;
  serviceId: string;
  ipAddress?: string | null;
  honeypot?: string | null;
  formStartedAt?: string | null;
  userAgent?: string | null;
};

export type SpamCheckResult = {
  blocked: boolean;
  spamScore: number;
  isDuplicateSuspected: boolean;
  reasons: string[];
};

function fingerprint(input: {
  email: string;
  serviceId: string;
  phone?: string | null;
}): string {
  return createHash("sha256")
    .update(
      `${input.email.toLowerCase()}|${input.serviceId}|${(input.phone ?? "").replace(/\D/g, "")}`,
    )
    .digest("hex");
}

export async function evaluateLeadSpam(
  input: SpamCheckInput,
): Promise<SpamCheckResult> {
  const reasons: string[] = [];
  let spamScore = 0;

  if (input.honeypot && input.honeypot.trim().length > 0) {
    return {
      blocked: true,
      spamScore: 100,
      isDuplicateSuspected: false,
      reasons: ["Honeypot filled"],
    };
  }

  if (input.formStartedAt) {
    const started = Date.parse(input.formStartedAt);
    if (!Number.isNaN(started)) {
      const elapsedSec = (Date.now() - started) / 1000;
      if (elapsedSec < MIN_FORM_SECONDS) {
        spamScore += 40;
        reasons.push("Form submitted too quickly");
      }
    }
  }

  if (!input.userAgent || input.userAgent.length < 10) {
    spamScore += 15;
    reasons.push("Missing or short user-agent");
  }

  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const recentByEmail = await prisma.lead.count({
    where: {
      contactEmail: input.email.toLowerCase(),
      createdAt: { gte: since },
    },
  });
  if (recentByEmail >= RATE_LIMIT_MAX) {
    return {
      blocked: true,
      spamScore: 100,
      isDuplicateSuspected: true,
      reasons: ["Rate limit exceeded for this email"],
    };
  }

  const duplicateSince = new Date(Date.now() - DUPLICATE_WINDOW_MS);
  const duplicate = await prisma.lead.findFirst({
    where: {
      contactEmail: input.email.toLowerCase(),
      serviceId: input.serviceId,
      createdAt: { gte: duplicateSince },
      status: { notIn: ["UNQUALIFIED", "ARCHIVED", "REFUNDED"] },
    },
    orderBy: { createdAt: "desc" },
  });

  let isDuplicateSuspected = false;
  if (duplicate) {
    isDuplicateSuspected = true;
    spamScore += 35;
    reasons.push("Similar request submitted in the last 24 hours");
  }

  // Soft signal: very long nonsense-looking phone
  if (input.phone && input.phone.replace(/\D/g, "").length > 15) {
    spamScore += 20;
    reasons.push("Unusual phone format");
  }

  const blocked = spamScore >= 80;
  return {
    blocked,
    spamScore,
    isDuplicateSuspected,
    reasons,
    // fingerprint unused publicly but kept for future Redis keys
  };
}

export function leadFingerprint(input: {
  email: string;
  serviceId: string;
  phone?: string | null;
}): string {
  return fingerprint(input);
}
