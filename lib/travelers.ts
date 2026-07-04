import type { TourPricing } from "@/lib/database.types";
import { hasTierPricing, type BookingSelection } from "@/lib/pricing";

export type TravelerGender = "male" | "female" | "unspecified";

export type TravelerSlot = {
  position: number;
  travelerType: "adult" | "child";
  childTierKey: string | null;
  childTierLabel: string | null;
  label: string;
};

export type TravelerDetailsInput = {
  firstName: string;
  lastName: string;
  phone: string;
  passportNumber: string;
  dateOfBirth: string;
  gender: TravelerGender;
};

/** @deprecated Use TravelerDetailsInput */
export type TravelerBasicInput = TravelerDetailsInput;

export function formatTravelerName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

export function splitFullName(name: string): { firstName: string; lastName: string } {
  const trimmed = name.trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const space = trimmed.indexOf(" ");
  if (space === -1) return { firstName: trimmed, lastName: "" };
  return {
    firstName: trimmed.slice(0, space),
    lastName: trimmed.slice(space + 1).trim(),
  };
}

export const emptyTravelerDetails = (): TravelerDetailsInput => ({
  firstName: "",
  lastName: "",
  phone: "",
  passportNumber: "",
  dateOfBirth: "",
  gender: "unspecified",
});

/** @deprecated Use emptyTravelerDetails */
export const emptyTravelerBasic = emptyTravelerDetails;

const ADULT_MIN_AGE = 12;
const CHILD_MAX_AGE = 17;

/** Map tiered pricing selection to ordered traveler slots. */
export function expandTravelerSlots(
  pricing: TourPricing | null,
  selection: BookingSelection,
): TravelerSlot[] {
  if (!hasTierPricing(pricing)) return [];

  const p = pricing as TourPricing;
  const idx = selection.occupancyIndex ?? 0;
  const tier = p.occupancy[idx] ?? p.occupancy[0];
  const slots: TravelerSlot[] = [];
  let position = 1;

  const adults = tier?.occupants ?? 0;
  for (let i = 0; i < adults; i++) {
    slots.push({
      position,
      travelerType: "adult",
      childTierKey: null,
      childTierLabel: null,
      label: adults === 1 ? "Adult" : `Adult ${i + 1}`,
    });
    position++;
  }

  for (let tierIdx = 0; tierIdx < p.children.length; tierIdx++) {
    const childTier = p.children[tierIdx];
    const count = Math.max(0, selection.childCounts[tierIdx] ?? 0);
    for (let i = 0; i < count; i++) {
      slots.push({
        position,
        travelerType: "child",
        childTierKey: childTier.key,
        childTierLabel: childTier.label,
        label:
          count === 1
            ? childTier.label
            : `${childTier.label} ${i + 1}`,
      });
      position++;
    }
  }

  return slots;
}

/** Age in full years on the travel date. */
export function ageAtTravel(dateOfBirth: string, travelDate: string): number {
  const dob = new Date(`${dateOfBirth}T12:00:00`);
  const travel = new Date(`${travelDate}T12:00:00`);
  let age = travel.getFullYear() - dob.getFullYear();
  const monthDiff = travel.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && travel.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function validateTravelerAgeForSlot(
  slot: TravelerSlot,
  dateOfBirth: string,
  travelDate: string,
): string | null {
  const age = ageAtTravel(dateOfBirth, travelDate);
  if (age < 0) return "Date of birth cannot be after the travel date.";
  if (slot.travelerType === "adult" && age < ADULT_MIN_AGE) {
    return `${slot.label} must be at least ${ADULT_MIN_AGE} years old on the travel date.`;
  }
  if (slot.travelerType === "child" && age > CHILD_MAX_AGE) {
    return `${slot.label} must be ${CHILD_MAX_AGE} years old or younger on the travel date.`;
  }
  return null;
}

/** Passport must be valid at least 6 months past travel date. */
export function validatePassportExpiry(
  passportExpiry: string,
  travelDate: string,
): string | null {
  const expiry = new Date(`${passportExpiry}T12:00:00`);
  const travel = new Date(`${travelDate}T12:00:00`);
  const minValid = new Date(travel);
  minValid.setMonth(minValid.getMonth() + 6);

  if (expiry < minValid) {
    return "Passport must be valid for at least 6 months past the travel date.";
  }
  return null;
}

export function isPassportComplete(traveler: {
  passport_number?: string | null;
  passport_expiry?: string | null;
  nationality?: string | null;
}): boolean {
  return Boolean(
    traveler.passport_number?.trim() &&
      traveler.passport_expiry &&
      traveler.nationality?.trim(),
  );
}

export function maskPassportNumber(passportNumber: string): string {
  const trimmed = passportNumber.trim();
  if (trimmed.length <= 4) return "••••";
  return `•••${trimmed.slice(-4)}`;
}
