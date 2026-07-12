CREATE TABLE "mobile_devices" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" STRING(100) NOT NULL,
  "token_hash" STRING(64) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_used_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  CONSTRAINT "mobile_devices_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "mobile_devices_token_hash_key" UNIQUE ("token_hash")
);

CREATE TABLE "pairing_codes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code_hash" STRING(64) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "device_id" UUID,
  CONSTRAINT "pairing_codes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "pairing_codes_code_hash_key" UNIQUE ("code_hash"),
  CONSTRAINT "pairing_codes_device_id_key" UNIQUE ("device_id"),
  CONSTRAINT "pairing_codes_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "mobile_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "pairing_codes_expires_at_idx" ON "pairing_codes" ("expires_at");
