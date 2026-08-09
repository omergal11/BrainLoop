-- Migration: encrypt the users.email column at rest.
--
-- Fernet ciphertext is longer than plaintext and base64-encoded, so the
-- column needs to grow. A new email_hash column is added as a deterministic,
-- searchable stand-in for equality/uniqueness checks (see backend/encryption.py).
--
-- Run this BEFORE deploying the updated backend code, then run
-- backfill_encrypt_emails.py to encrypt any existing plaintext rows.

ALTER TABLE `users`
  MODIFY COLUMN `email` VARCHAR(255) DEFAULT NULL,
  ADD COLUMN `email_hash` VARCHAR(64) DEFAULT NULL AFTER `email`;

CREATE INDEX `idx_users_email_hash` ON `users` (`email_hash`);
