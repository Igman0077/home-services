import { z } from "zod";

export const quoteStepServiceSchema = z.object({
  serviceId: z.string().cuid("Select a service"),
  locationId: z.string().cuid().optional().or(z.literal("")),
  zipCode: z
    .string()
    .trim()
    .regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code")
    .optional()
    .or(z.literal("")),
});

export const quoteStepProjectSchema = z.object({
  projectDescription: z
    .string()
    .trim()
    .min(20, "Please describe the project in at least 20 characters")
    .max(4000),
  desiredTimeline: z.string().trim().max(120).optional().or(z.literal("")),
  propertyType: z
    .enum([
      "SINGLE_FAMILY",
      "MULTI_FAMILY",
      "CONDO",
      "TOWNHOUSE",
      "MOBILE",
      "COMMERCIAL",
      "OTHER",
    ])
    .optional(),
});

export const quoteStepContactSchema = z.object({
  contactName: z.string().trim().min(2).max(120),
  contactEmail: z.string().trim().email().max(255),
  contactPhone: z
    .string()
    .trim()
    .min(10, "Enter a phone number")
    .max(30)
    .optional()
    .or(z.literal("")),
  preferredContact: z.enum(["EMAIL", "PHONE", "EITHER"]).default("EITHER"),
  consent: z.literal(true, {
    message: "You must agree to the contact terms to continue",
  }),
  // Honeypot — must stay empty
  companyWebsite: z.string().max(0).optional().or(z.literal("")),
});

export const quoteRequestSchema = quoteStepServiceSchema
  .merge(quoteStepProjectSchema)
  .merge(quoteStepContactSchema)
  .extend({
    businessSlug: z.string().optional(),
    formStartedAt: z.string().optional(),
  });

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
