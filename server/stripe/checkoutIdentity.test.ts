import { expect, it } from "vitest";
import { checkoutIdentityMatches, validatedPhone } from "./checkoutIdentity";
it("requires an existing verified purchaser and rejects conflicting sessions", () => {
  expect(
    checkoutIdentityMatches({ user: null, studentEmail: null }, "buyer@test.ca")
  ).toBe(false);
  expect(
    checkoutIdentityMatches(
      { user: null, studentEmail: "BUYER@test.ca" },
      "buyer@test.ca"
    )
  ).toBe(true);
  expect(
    checkoutIdentityMatches(
      {
        user: { email: "other@test.ca" } as any,
        studentEmail: "buyer@test.ca",
      },
      "buyer@test.ca"
    )
  ).toBe(false);
});
it("accepts plausible phone numbers without turning missing fields into destructive updates", () => {
  expect(validatedPhone("+1 (204) 555-0100")).toBe("+1 (204) 555-0100");
  for (const input of [undefined, null, "", "   ", "not a phone", "123"])
    expect(validatedPhone(input)).toBeNull();
});
