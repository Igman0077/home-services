"use server";

import { z } from "zod";

import {
  estimateRoofReplacement,
  type RoofCalculatorInputs,
} from "@/lib/calculators/roof";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type CalculatorActionResult = {
  ok: boolean;
  error?: string;
  lowCents?: number;
  highCents?: number;
  assumptions?: string[];
  disclaimer?: string;
  submissionId?: string;
};

const roofSchema = z.object({
  squares: z.coerce.number().min(5).max(80),
  pitch: z.enum(["low", "medium", "steep"]),
  material: z.enum(["asphalt", "metal"]),
  consent: z.enum(["true", "false"]).optional(),
  save: z.enum(["true", "false"]).optional(),
});

export async function runRoofCalculatorAction(
  _prev: CalculatorActionResult,
  formData: FormData,
): Promise<CalculatorActionResult> {
  const parsed = roofSchema.safeParse({
    squares: formData.get("squares"),
    pitch: formData.get("pitch"),
    material: formData.get("material"),
    consent: formData.get("consent") ?? "false",
    save: formData.get("save") ?? "false",
  });
  if (!parsed.success) {
    return { ok: false, error: "Check squares (5–80), pitch, and material." };
  }

  const inputs: RoofCalculatorInputs = {
    squares: parsed.data.squares,
    pitch: parsed.data.pitch,
    material: parsed.data.material,
  };
  const result = estimateRoofReplacement(inputs);

  let submissionId: string | undefined;
  if (parsed.data.save === "true") {
    const calculator = await prisma.calculator.findUnique({
      where: { slug: "roof-replacement" },
    });
    if (calculator) {
      const session = await auth();
      const submission = await prisma.calculatorSubmission.create({
        data: {
          calculatorId: calculator.id,
          userId: session?.user?.id,
          inputs,
          results: result,
          consentGiven: parsed.data.consent === "true",
        },
      });
      submissionId = submission.id;
    }
  }

  return {
    ok: true,
    lowCents: result.lowCents,
    highCents: result.highCents,
    assumptions: result.assumptions,
    disclaimer: result.disclaimer,
    submissionId,
  };
}
