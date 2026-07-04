import { z } from "zod";
import { EMAIL_REGEX } from "@/lib/validation";

// Validation schemas for the public (untrusted) server actions. Mirrors the Zod
// pattern already used in app/admin/email-templates/actions.ts. Unknown keys are
// stripped by default, so a client can never smuggle extra fields (e.g. a
// pre-computed total_cents) into a mutation.

const emailField = z
  .string()
  .trim()
  .regex(EMAIL_REGEX, "Please enter a valid email address.");

export const newsletterEmailSchema = emailField.transform((e) => e.toLowerCase());

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(200),
  email: emailField,
  phone: z.string().trim().max(50).optional(),
  interest: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1, "Please add a short message.").max(5000),
});
export type ContactValues = z.infer<typeof contactSchema>;

const isoDateField = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid date.");

export const travelerGenderSchema = z.enum(["male", "female", "unspecified"]);

export const travelerBasicSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "Please enter the traveler's first name.")
    .max(100),
  lastName: z
    .string()
    .trim()
    .min(1, "Please enter the traveler's last name.")
    .max(100),
  phone: z
    .string()
    .trim()
    .min(1, "Please enter a phone number.")
    .max(50),
  passportNumber: z
    .string()
    .trim()
    .min(1, "Please enter a passport number.")
    .max(50),
  dateOfBirth: isoDateField,
  gender: travelerGenderSchema,
});
export type TravelerBasicValues = z.infer<typeof travelerBasicSchema>;

export const travelerPassportSchema = z.object({
  travelerId: z.string().uuid("Invalid traveler."),
  passportExpiry: isoDateField,
  nationality: z.string().trim().min(1, "Please select a nationality.").max(100),
  referenceCode: z.string().trim().max(20).optional(),
  email: emailField.optional(),
});
export type TravelerPassportValues = z.infer<typeof travelerPassportSchema>;

// The booking input is now a *selection*, never a price. The server recomputes
// the authoritative total from this via lib/pricing.ts.
export const bookingSchema = z.object({
  tourId: z.string().uuid("Invalid tour."),
  travelDate: z.string().trim().min(1, "Please select a travel date."),
  occupancyIndex: z.number().int().min(0).max(50).nullable(),
  childCounts: z.array(z.number().int().min(0).max(50)).max(20),
  travelers: z.number().int().min(0).max(50),
  insurance: z.boolean(),
  contactName: z.string().trim().min(1, "Please enter your name.").max(200),
  contactEmail: emailField,
  contactPhone: z.string().trim().min(1, "Please enter your phone number.").max(50),
  specialRequests: z.string().trim().max(2000).optional(),
  travelerDetails: z.array(travelerBasicSchema).max(50).optional(),
});
export type BookingValues = z.infer<typeof bookingSchema>;

export const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Please enter your name.").max(200),
  phone: z.string().trim().max(50).optional(),
});

export const travelPreferencesSchema = z.object({
  dietary: z.string().trim().max(500).optional(),
  mobility: z.string().trim().max(500).optional(),
  interests: z.array(z.string().trim().max(100)).max(20).optional(),
  room_preference: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const bookingMessageSchema = z.object({
  bookingId: z.string().uuid(),
  body: z.string().trim().min(1, "Message cannot be empty.").max(5000),
});

export const reviewSchema = z.object({
  tourId: z.string().uuid(),
  bookingId: z.string().uuid().optional(),
  rating: z.number().min(1).max(5),
  body: z.string().trim().min(10, "Please write at least 10 characters.").max(5000),
});

export const passwordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

export const emailUpdateSchema = z.object({
  email: emailField,
});

export const claimBookingSchema = z.object({
  reference: z.string().trim().min(1, "Enter your booking reference.").max(20),
});

export const chatbotRequestSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  session_id: z.string().trim().min(1).max(128),
});
export type ChatbotRequestValues = z.infer<typeof chatbotRequestSchema>;
