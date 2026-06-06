-- Store monetary amounts as fixed-precision DECIMAL instead of floating point
-- to avoid rounding errors in financial data.
ALTER TABLE "payment_invoices" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2);
