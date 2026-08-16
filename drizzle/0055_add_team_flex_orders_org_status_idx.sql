-- PROPOSED FORWARD-ONLY MIGRATION — NOT APPLIED TO PRODUCTION.
-- Apply only through the approved migration workflow after Ay authorizes it.
CREATE INDEX `team_flex_orders_org_status_idx` ON `team_flex_orders` (`organizationId`, `status`);
