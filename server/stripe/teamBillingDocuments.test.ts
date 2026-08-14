import { describe, expect, it } from "vitest";
import {
  buildTeamFlexBillingDocumentOptions,
  buildTeamSubscriptionBillingDocumentOptions,
} from "./teamBillingDocuments";

describe("Teams billing document checkout options", () => {
  it("collects the billing details needed for subscription invoices", () => {
    expect(buildTeamSubscriptionBillingDocumentOptions()).toEqual({
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
    });
  });

  it("guarantees a receipt email and enables a paid invoice for Flex payments", () => {
    const options = buildTeamFlexBillingDocumentOptions({
      billingEmail: " Billing@Winnipeg.ca ",
      organizationName: "City of Winnipeg",
      orderId: 247,
    });

    expect(options.customer_email).toBe("billing@winnipeg.ca");
    expect(options.payment_intent_data.receipt_email).toBe(
      "billing@winnipeg.ca"
    );
    expect(options.invoice_creation.enabled).toBe(true);
    expect(options.invoice_creation.invoice_data.metadata).toMatchObject({
      type: "team_flex",
      teamFlexOrderId: "247",
      orderReference: "TF-247",
    });
    expect(options.invoice_creation.invoice_data.custom_fields).toContainEqual({
      name: "Organization",
      value: "City of Winnipeg",
    });
    expect(options.billing_address_collection).toBe("required");
    expect(options.tax_id_collection.enabled).toBe(true);
  });

  it("keeps invoice custom fields inside Stripe's 140-character limit", () => {
    const options = buildTeamFlexBillingDocumentOptions({
      billingEmail: "billing@example.ca",
      organizationName: "A".repeat(200),
      orderId: 1,
    });

    const organizationField =
      options.invoice_creation.invoice_data.custom_fields[0];
    expect(organizationField.value).toHaveLength(140);
  });
});
