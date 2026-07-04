/** Common nationalities for passport forms (ISO 3166-1 alpha-2 code + label). */
export const COUNTRIES = [
  { code: "AG", label: "Antigua and Barbuda" },
  { code: "BS", label: "Bahamas" },
  { code: "BB", label: "Barbados" },
  { code: "BZ", label: "Belize" },
  { code: "CA", label: "Canada" },
  { code: "CO", label: "Colombia" },
  { code: "CR", label: "Costa Rica" },
  { code: "CU", label: "Cuba" },
  { code: "DM", label: "Dominica" },
  { code: "DO", label: "Dominican Republic" },
  { code: "FR", label: "France" },
  { code: "GD", label: "Grenada" },
  { code: "GY", label: "Guyana" },
  { code: "HT", label: "Haiti" },
  { code: "IN", label: "India" },
  { code: "IE", label: "Ireland" },
  { code: "JM", label: "Jamaica" },
  { code: "MX", label: "Mexico" },
  { code: "NL", label: "Netherlands" },
  { code: "PA", label: "Panama" },
  { code: "PR", label: "Puerto Rico" },
  { code: "KN", label: "Saint Kitts and Nevis" },
  { code: "LC", label: "Saint Lucia" },
  { code: "VC", label: "Saint Vincent and the Grenadines" },
  { code: "SR", label: "Suriname" },
  { code: "TT", label: "Trinidad and Tobago" },
  { code: "GB", label: "United Kingdom" },
  { code: "US", label: "United States" },
  { code: "VE", label: "Venezuela" },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];

export function countryLabel(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.label ?? code;
}
