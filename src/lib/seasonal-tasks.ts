export type SeasonalSuggestion = {
  title: string;
  description: string;
  recurrence: "yearly" | "seasonal";
  monthHint: number;
};

/**
 * Northern NY–oriented seasonal maintenance ideas.
 * Educational suggestions only — not personalized inspection advice.
 */
export function getSeasonalSuggestions(
  month = new Date().getMonth() + 1,
): SeasonalSuggestion[] {
  const catalog: SeasonalSuggestion[] = [
    {
      title: "Check smoke and CO detectors",
      description:
        "Test all detectors and replace batteries. Northern winters increase indoor heating use and CO risk.",
      recurrence: "yearly",
      monthHint: 10,
    },
    {
      title: "Inspect roof for ice-dam risk",
      description:
        "Look for missing shingles, clogged valleys, and attic ventilation issues before deep freeze.",
      recurrence: "seasonal",
      monthHint: 11,
    },
    {
      title: "Winterize outdoor faucets and hoses",
      description:
        "Disconnect hoses, shut off exterior valves, and drain lines to reduce freeze bursts.",
      recurrence: "yearly",
      monthHint: 10,
    },
    {
      title: "Service furnace / heat pump",
      description:
        "Schedule professional HVAC service before peak heating demand. Filter changes can be monthly.",
      recurrence: "yearly",
      monthHint: 9,
    },
    {
      title: "Clear gutters and downspouts",
      description:
        "Remove leaves and ice-prone debris so meltwater drains away from the foundation.",
      recurrence: "seasonal",
      monthHint: 10,
    },
    {
      title: "Spring plumbing thaw check",
      description:
        "After freeze-thaw cycles, check for slow leaks under sinks, at the water heater, and at outdoor shutoffs.",
      recurrence: "seasonal",
      monthHint: 4,
    },
    {
      title: "Clean dryer vent",
      description:
        "Clear lint from the dryer vent path to reduce fire risk and improve efficiency.",
      recurrence: "yearly",
      monthHint: 3,
    },
    {
      title: "Test sump pump",
      description:
        "Pour water into the pit to confirm the pump starts. Critical before spring melt and heavy rain.",
      recurrence: "seasonal",
      monthHint: 3,
    },
    {
      title: "Seal weatherstripping and door sweeps",
      description:
        "Reduce drafts before heating season; check attic hatch and basement doors.",
      recurrence: "yearly",
      monthHint: 9,
    },
    {
      title: "Check window well covers and drainage",
      description:
        "Ensure covers are intact and drains are clear ahead of spring runoff.",
      recurrence: "seasonal",
      monthHint: 3,
    },
  ];

  // Prefer items near the current month (±1), fall back to full catalog slice
  const nearby = catalog.filter((item) => {
    const delta = Math.min(
      Math.abs(item.monthHint - month),
      12 - Math.abs(item.monthHint - month),
    );
    return delta <= 1;
  });

  return nearby.length >= 3 ? nearby : catalog.slice(0, 6);
}

export function nextDueDateForSuggestion(
  monthHint: number,
  from = new Date(),
): Date {
  const year =
    from.getMonth() + 1 > monthHint ? from.getFullYear() + 1 : from.getFullYear();
  // Mid-month suggestion due date
  return new Date(Date.UTC(year, monthHint - 1, 15));
}
