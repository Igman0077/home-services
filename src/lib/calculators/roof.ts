export type RoofCalculatorInputs = {
  squares: number;
  pitch: "low" | "medium" | "steep";
  material: "asphalt" | "metal";
};

export type RoofCalculatorResult = {
  lowCents: number;
  highCents: number;
  assumptions: string[];
  disclaimer: string;
};

const MATERIAL_PER_SQUARE_CENTS = {
  asphalt: { low: 45000, high: 75000 }, // $450–$750 / square
  metal: { low: 90000, high: 160000 },
} as const;

const PITCH_MULTIPLIER = {
  low: { low: 1, high: 1.05 },
  medium: { low: 1.08, high: 1.2 },
  steep: { low: 1.2, high: 1.45 },
} as const;

/**
 * Educational roof replacement range estimator.
 * Intentionally coarse — never presented as a contractor bid.
 */
export function estimateRoofReplacement(
  inputs: RoofCalculatorInputs,
): RoofCalculatorResult {
  const squares = Math.min(80, Math.max(5, inputs.squares));
  const material = MATERIAL_PER_SQUARE_CENTS[inputs.material];
  const pitch = PITCH_MULTIPLIER[inputs.pitch];

  const lowCents = Math.round(squares * material.low * pitch.low);
  const highCents = Math.round(squares * material.high * pitch.high);

  return {
    lowCents,
    highCents,
    assumptions: [
      `${squares} roof squares`,
      `${inputs.material} material baseline`,
      `${inputs.pitch} pitch complexity multiplier`,
      "Excludes tear-off surprises, structural repairs, permits, and financing",
      "Northern NY labor/material access can push results toward the high end in winter",
    ],
    disclaimer:
      "Estimate only — not a quote, appraisal, or professional recommendation. Request local on-site estimates for real pricing.",
  };
}

export function formatUsdFromCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
