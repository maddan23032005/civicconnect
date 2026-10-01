CREATE TABLE IF NOT EXISTS payments (
  id              BIGSERIAL PRIMARY KEY,
  receipt_id      TEXT UNIQUE NOT NULL,
  user_id         TEXT NOT NULL,
  citizen_name    TEXT NOT NULL,
  mobile          TEXT NOT NULL,

  purpose         TEXT NOT NULL,
  purpose_code    TEXT NOT NULL,
  reference_id    TEXT,

  amount_paise    BIGINT NOT NULL CHECK (amount_paise > 0),
  currency        TEXT NOT NULL DEFAULT 'INR',

  status          TEXT NOT NULL DEFAULT 'created'
                  CHECK (status IN ('created','processing','succeeded','failed','refunded')),
  method          TEXT,
  gateway         TEXT NOT NULL DEFAULT 'demo',
  gateway_ref     TEXT,
  failure_reason  TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_user    ON payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status  ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_receipt ON payments(receipt_id);

-- Append-only audit trail. Every state change is recorded; rows are never updated.
CREATE TABLE IF NOT EXISTS payment_ledger (
  id           BIGSERIAL PRIMARY KEY,
  payment_id   BIGINT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  event        TEXT NOT NULL,
  from_status  TEXT,
  to_status    TEXT,
  detail       JSONB DEFAULT '{}'::jsonb,
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_payment ON payment_ledger(payment_id, recorded_at);
