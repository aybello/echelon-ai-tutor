-- Internal review fields for staged historical-customer evidence.
-- This migration is additive only. None of these fields creates an organization,
-- manager, licence, user, purchase, subscription, or learner entitlement.
ALTER TABLE `customer_recovery_evidence`
  ADD COLUMN `recoverySubjectType` enum('individual','organization_manager') NULL,
  ADD COLUMN `recoveryOrganizationName` varchar(128) NULL,
  ADD COLUMN `recoveryOrganizationGroup` enum('treatment','distribution','unspecified') NULL,
  ADD COLUMN `recoverySeatCount` int NULL;
