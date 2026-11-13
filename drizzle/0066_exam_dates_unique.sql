-- Reconcile existing exam_dates using the reviewed, backup-first release tool before applying.
-- This statement intentionally fails if duplicate learner/course records remain.
CREATE UNIQUE INDEX `exam_dates_email_product_unique` ON `exam_dates` (`email`, `productKey`);
