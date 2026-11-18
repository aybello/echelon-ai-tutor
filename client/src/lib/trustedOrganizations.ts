import organizations from "./trustedOrganizations.json";

const customerSlugs = ["utilities-kingston", "city-of-winnipeg", "city-of-quinte-west"] as const;

function organizationFor(slug: string) {
  const organization = organizations.find(item => item.slug === slug);
  if (!organization) throw new Error(`Missing official organization asset: ${slug}`);
  return organization;
}

// BEA is deliberately not part of the customer list.
export const customers = customerSlugs.map(organizationFor);
export const supporter = organizationFor("black-entrepreneurship-alliance");
