export function computeProfileCompleteness(input: {
  name?: string | null;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  city?: string | null;
  serviceCount: number;
  areaCount: number;
  hoursCount: number;
}): number {
  let score = 0;
  if (input.name) score += 10;
  if (input.description && input.description.length >= 80) score += 20;
  else if (input.description) score += 10;
  if (input.phone) score += 10;
  if (input.email) score += 10;
  if (input.website) score += 5;
  if (input.city) score += 10;
  if (input.serviceCount > 0) score += 15;
  if (input.areaCount > 0) score += 15;
  if (input.hoursCount > 0) score += 5;
  return Math.min(100, score);
}
