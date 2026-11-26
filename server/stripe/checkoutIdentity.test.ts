import { expect, it } from "vitest";
import { checkoutIdentityMatches, validatedPhone } from "./checkoutIdentity";
it("requires an existing verified purchaser and rejects conflicting sessions", () => {
  expect(
    checkoutIdentityMatches({ user: null, studentEmail: null }, "fixture-1@example.com")
  ).toBe(false);
  expect(
    checkoutIdentityMatches(
      { user: null, studentEmail: "FIXTURE-1@EXAMPLE.COM" },
      "fixture-1@example.com"
    )
  ).toBe(true);
  expect(
    checkoutIdentityMatches(
      {
        user: { email: "fixture-88@example.com" } as any,
        studentEmail: "fixture-1@example.com",
      },
      "fixture-1@example.com"
    )
  ).toBe(false);
});
it("accepts plausible phone numbers without turning missing fields into destructive updates", () => {
  expect(validatedPhone("+1 (204) 555-0100")).toBe("+1 (204) 555-0100");
  for (const input of [undefined, null, "", "   ", "not a phone", "123"])
    expect(validatedPhone(input)).toBeNull();
});
