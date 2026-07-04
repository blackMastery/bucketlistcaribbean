import { describe, it, expect } from "vitest";
import { isValidEmail } from "@/lib/validation";

describe("isValidEmail", () => {
  it("accepts a normal address", () => {
    expect(isValidEmail("jane@example.com")).toBe(true);
  });

  it("accepts an address with subdomain and plus tag", () => {
    expect(isValidEmail("jane.doe+travel@mail.example.co")).toBe(true);
  });

  it("trims surrounding whitespace before checking", () => {
    expect(isValidEmail("  jane@example.com  ")).toBe(true);
  });

  it("rejects an address with no @", () => {
    expect(isValidEmail("janeexample.com")).toBe(false);
  });

  it("rejects an address with no domain dot", () => {
    expect(isValidEmail("jane@example")).toBe(false);
  });

  it("rejects an address with internal whitespace", () => {
    expect(isValidEmail("ja ne@example.com")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidEmail("")).toBe(false);
  });
});
