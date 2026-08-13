-- Migration 0050: Course Pass guest checkout repair
--
-- Guest purchasers do not have a users row, so purchaserUserId must remain
-- nullable. Stripe tax and the final paid amount are also unknown until the
-- webhook arrives. Reasserting these definitions is safe if 0048 already ran
-- and repairs Manus databases where the earlier ALTER was skipped.

ALTER TABLE `team_flex_orders`
  MODIFY COLUMN `purchaserUserId` int NULL,
  MODIFY COLUMN `taxCents` int NULL,
  MODIFY COLUMN `totalPaidCents` int NULL;
