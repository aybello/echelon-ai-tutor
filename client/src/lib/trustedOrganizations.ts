import organizations from "./trustedOrganizations.json";

const customerSlugs = ["utilities-kingston", "city-of-winnipeg", "city-of-quinte-west"] as const;

function organizationFor(slug: string) {
  const organization = organizations.find(item => item.slug === slug);
  if (!organization) throw new Error(`Missing official organization asset: ${slug}`);
  return organization;
}

export const customers = customerSlugs.map(organizationFor);
