const INVOICE_ORGANIZATION_NAME_LIMIT = 140;

export function buildTeamSubscriptionBillingDocumentOptions() {
  return {
    billing_address_collection: "required" as const,
    tax_id_collection: { enabled: true },
  };
}

export function buildTeamFlexBillingDocumentOptions(input: {
  billingEmail: string;
  organizationName: string;
  orderId: number;
}) {
  const billingEmail = input.billingEmail.trim().toLowerCase();
  const organizationName = input.organizationName.trim();
  const invoiceOrganizationName = organizationName.slice(
    0,
    INVOICE_ORGANIZATION_NAME_LIMIT
  );
  const orderReference = `TF-${input.orderId}`;
  const sharedMetadata = {
    type: "team_flex",
    teamFlexOrderId: String(input.orderId),
    orderReference,
  };

  return {
    customer_email: billingEmail,
    billing_address_collection: "required" as const,
    tax_id_collection: { enabled: true },
    payment_intent_data: {
      description: `Echelon Teams Flex order ${orderReference}`,
      receipt_email: billingEmail,
      metadata: sharedMetadata,
    },
    invoice_creation: {
      enabled: true,
      invoice_data: {
        description: `${organizationName} — Echelon Teams Flex Course Passes`,
        footer:
          "Paid online through Stripe. Questions: abello@echeloninstitute.ca",
        custom_fields: [
          { name: "Organization", value: invoiceOrganizationName },
          { name: "Order reference", value: orderReference },
        ],
        metadata: sharedMetadata,
      },
    },
  };
}
