CREATE TABLE IF NOT EXISTS purchase_email_outbox (
  id int AUTO_INCREMENT PRIMARY KEY,
  stripeSessionId varchar(255) NOT NULL,
  payload text NOT NULL,
  status enum('pending','sending','sent','failed') NOT NULL DEFAULT 'pending',
  attempts int NOT NULL DEFAULT 0,
  availableAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  leaseToken varchar(36) NULL,
  sentAt timestamp NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY purchase_email_session_unique_idx (stripeSessionId),
  KEY purchase_email_delivery_idx (status, availableAt)
);
