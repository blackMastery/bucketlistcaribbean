// Shared input-validation primitives. Single source of truth for the email
// shape check that was previously copy-pasted across server actions, forms, and
// the email sender.

export const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** True when `value` (after trimming) looks like a syntactically valid email. */
export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}
