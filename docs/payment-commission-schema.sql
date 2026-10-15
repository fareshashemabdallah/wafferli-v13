-- PROPOSED POSTGRESQL SCHEMA ONLY. Do NOT apply to the static pilot.
-- All writes must be restricted to a trusted backend after PSP verification.
-- No customer card data, bank credentials, merchant fund balances or transfer API.

CREATE TABLE IF NOT EXISTS merchant_commission_agreements (
 id TEXT PRIMARY KEY,
 merchant_id TEXT,
 commercial_category TEXT,
 rate_basis_points INTEGER NOT NULL CHECK (rate_basis_points BETWEEN 0 AND 10000),
 valid_from DATE NOT NULL,
 valid_through DATE,
 merchant_contract_reference TEXT NOT NULL,
 approved_by TEXT NOT NULL,
 approved_at TIMESTAMPTZ NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CONSTRAINT merchant_or_category_required CHECK (merchant_id IS NOT NULL OR commercial_category IS NOT NULL),
 CONSTRAINT valid_commission_interval CHECK (valid_through IS NULL OR valid_through >= valid_from)
);
-- Overlap at the same specificity is prohibited by business validation before checkout.
-- Never overwrite historical agreement records; expire them and add versioned rows.

CREATE TABLE IF NOT EXISTS merchant_payment_transactions (
 internal_transaction_reference TEXT PRIMARY KEY,
 merchant_id TEXT NOT NULL,
 commercial_category TEXT NOT NULL,
 offer_request_reference TEXT NOT NULL,
 agreement_id TEXT NOT NULL REFERENCES merchant_commission_agreements(id),
 currency CHAR(3) NOT NULL DEFAULT 'JOD' CHECK (currency='JOD'),
 gross_fils BIGINT NOT NULL CHECK (gross_fils > 0),
 commission_basis_points INTEGER NOT NULL CHECK (commission_basis_points BETWEEN 0 AND 10000),
 dabberna_commission_fils BIGINT NOT NULL CHECK (dabberna_commission_fils >= 0),
 merchant_entitlement_fils BIGINT NOT NULL CHECK (merchant_entitlement_fils >= 0),
 quoted_for_date DATE NOT NULL,
 provider_id TEXT NOT NULL,
 provider_merchant_account_reference TEXT NOT NULL,
 provider_transaction_reference TEXT UNIQUE,
 payment_status TEXT NOT NULL DEFAULT 'awaiting_payment'
   CHECK (payment_status IN ('awaiting_payment','pending','confirmed','failed','cancelled','partially_refunded','refunded','disputed')),
 commission_settlement_status TEXT NOT NULL DEFAULT 'not_due'
   CHECK (commission_settlement_status IN ('not_due','pending','partially_settled','settled','partially_reversed','reversed','failed')),
 refund_cancellation_status TEXT NOT NULL DEFAULT 'none'
   CHECK (refund_cancellation_status IN ('none','refund_pending','partially_refunded','refunded','cancelled','disputed')),
 refunded_fils BIGINT NOT NULL DEFAULT 0 CHECK (refunded_fils >= 0),
 commission_settled_fils BIGINT NOT NULL DEFAULT 0 CHECK (commission_settled_fils >= 0),
 commission_reversed_fils BIGINT NOT NULL DEFAULT 0 CHECK (commission_reversed_fils >= 0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 last_provider_event_at TIMESTAMPTZ,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CONSTRAINT allocation_reconciles CHECK (gross_fils = dabberna_commission_fils + merchant_entitlement_fils),
 CONSTRAINT refunds_not_above_gross CHECK (refunded_fils <= gross_fils),
 CONSTRAINT reversed_not_above_commission CHECK (commission_reversed_fils <= dabberna_commission_fils)
);

-- Protect original agreement and allocation snapshot against retrospective edits.
CREATE OR REPLACE FUNCTION protect_payment_quote_snapshot()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
 IF ROW(
   NEW.merchant_id,NEW.commercial_category,NEW.offer_request_reference,NEW.agreement_id,
   NEW.currency,NEW.gross_fils,NEW.commission_basis_points,NEW.dabberna_commission_fils,
   NEW.merchant_entitlement_fils,NEW.quoted_for_date,NEW.provider_id,NEW.provider_merchant_account_reference
 ) IS DISTINCT FROM ROW(
   OLD.merchant_id,OLD.commercial_category,OLD.offer_request_reference,OLD.agreement_id,
   OLD.currency,OLD.gross_fils,OLD.commission_basis_points,OLD.dabberna_commission_fils,
   OLD.merchant_entitlement_fils,OLD.quoted_for_date,OLD.provider_id,OLD.provider_merchant_account_reference
 ) THEN
   RAISE EXCEPTION 'Immutable payment quote cannot be changed';
 END IF;
 RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS payment_quote_is_immutable ON merchant_payment_transactions;
CREATE TRIGGER payment_quote_is_immutable
BEFORE UPDATE ON merchant_payment_transactions
FOR EACH ROW EXECUTE FUNCTION protect_payment_quote_snapshot();

CREATE TABLE IF NOT EXISTS merchant_payment_provider_events (
 provider_id TEXT NOT NULL,
 provider_event_reference TEXT NOT NULL,
 internal_transaction_reference TEXT NOT NULL REFERENCES merchant_payment_transactions(internal_transaction_reference),
 event_type TEXT NOT NULL,
 provider_occurred_at TIMESTAMPTZ,
 signature_verified_at TIMESTAMPTZ NOT NULL,
 received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 payload_sha256 CHAR(64) NOT NULL,
 PRIMARY KEY (provider_id,provider_event_reference)
);
-- An event may be inserted only after trusted webhook signature or server API verification.
-- Raw payment credentials and sensitive payloads must not be persisted.

CREATE TABLE IF NOT EXISTS merchant_payment_adjustments (
 id TEXT PRIMARY KEY,
 internal_transaction_reference TEXT NOT NULL REFERENCES merchant_payment_transactions(internal_transaction_reference),
 provider_adjustment_reference TEXT NOT NULL,
 kind TEXT NOT NULL CHECK (kind IN ('refund','cancellation','chargeback','reversal')),
 status TEXT NOT NULL CHECK (status IN ('pending','confirmed','failed')),
 gross_amount_fils BIGINT NOT NULL CHECK (gross_amount_fils >= 0),
 provider_confirmed_commission_reversal_fils BIGINT NOT NULL DEFAULT 0
   CHECK (provider_confirmed_commission_reversal_fils >= 0),
 provider_confirmed_processing_fee_reversal_fils BIGINT NOT NULL DEFAULT 0
   CHECK (provider_confirmed_processing_fee_reversal_fils >= 0),
 event_at TIMESTAMPTZ NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE (internal_transaction_reference,provider_adjustment_reference)
);

CREATE TABLE IF NOT EXISTS merchant_payment_reconciliation (
 id TEXT PRIMARY KEY,
 internal_transaction_reference TEXT NOT NULL REFERENCES merchant_payment_transactions(internal_transaction_reference),
 provider_id TEXT NOT NULL,
 provider_settlement_reference TEXT NOT NULL,
 provider_statement_line_reference TEXT NOT NULL,
 beneficiary TEXT NOT NULL CHECK (beneficiary IN ('dabberna','merchant')),
 settled_amount_fils BIGINT NOT NULL,
 provider_processing_fee_fils BIGINT NOT NULL DEFAULT 0,
 currency CHAR(3) NOT NULL DEFAULT 'JOD' CHECK (currency='JOD'),
 reconciliation_status TEXT NOT NULL
   CHECK (reconciliation_status IN ('matched','unmatched','exception')),
 discrepancy_reason TEXT,
 settled_at TIMESTAMPTZ,
 reconciled_at TIMESTAMPTZ,
 UNIQUE (provider_id,provider_settlement_reference,provider_statement_line_reference)
);

CREATE INDEX IF NOT EXISTS merchant_payment_by_offer ON merchant_payment_transactions(merchant_id,offer_request_reference);
CREATE INDEX IF NOT EXISTS merchant_payment_by_status ON merchant_payment_transactions(payment_status,commission_settlement_status);
CREATE INDEX IF NOT EXISTS merchant_payment_reconciliation_pending ON merchant_payment_reconciliation(reconciliation_status);

-- Deployment prerequisites:
-- 1) service identities, tenant restrictions, DB role permissions and audit controls.
-- 2) provider contract confirms merchant-originated noncustodial model.
-- 3) exact webhook signature/event replay verification and settlement report ingestion.
-- 4) transaction status reducer + refund bounds + reconciliation exceptions tested.
-- 5) approval by security, compliance and payments counsel.
