-- ============================================================
-- PETROL PUMP MANAGEMENT SYSTEM - COMPLETE SQL SCHEMA
-- Database: Supabase (PostgreSQL)
-- Rules: No RLS | No Triggers | Transaction-based | Multi-tenant | Multi-user
-- LOGIN: Simple — pump_code + email + password (companies table only)
-- ============================================================


-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE account_type      AS ENUM ('customer', 'supplier', 'employee', 'other');
CREATE TYPE product_unit      AS ENUM ('ltr', 'kg', 'cubic_meter', 'unit');
CREATE TYPE payment_mode      AS ENUM ('cash', 'credit', 'card', 'online');
CREATE TYPE voucher_type      AS ENUM ('receipt', 'payment');
CREATE TYPE ledger_ref_table  AS ENUM ('sales', 'purchases', 'vouchers', 'expenses', 'opening');
CREATE TYPE ledger_entry_type AS ENUM (
    'opening_balance',
    'sale',
    'purchase',
    'cash_receipt',
    'cash_payment',
    'expense',
    'adjustment'
);
CREATE TYPE stock_adj_type AS ENUM ('addition', 'reduction', 'correction');


-- ============================================================
-- 1. COMPANIES  (Multi-tenant root + Login table)
--
--  LOGIN FLOW (no extra auth):
--    1. User fills: Pump Code + Email + Password
--    2. App queries: SELECT * FROM companies
--                    WHERE pump_code = $1 AND email = $2 AND password = $3
--    3. If row returned → session stored in localStorage/cookie
--    4. Done — no OTP, no email verify, no tokens
-- ============================================================

CREATE TABLE companies (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    pump_code     VARCHAR(20)  UNIQUE NOT NULL,    -- e.g. PP-001  (used in login)
    business_name VARCHAR(255) NOT NULL,
    owner_name    VARCHAR(255),
    email         VARCHAR(255) UNIQUE NOT NULL,    -- used in login
    password      VARCHAR(255) NOT NULL,           -- plain text password
    mobile_no     VARCHAR(20)  NOT NULL,
    address       TEXT,
    ntn_number    VARCHAR(50),                     -- National Tax Number (Pakistan)
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 2. ACCOUNTS  (Customers / Suppliers / Employees / Other)
-- ============================================================

CREATE TABLE accounts (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id       UUID          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name             VARCHAR(255)  NOT NULL,
    type             account_type  NOT NULL,
    phone            VARCHAR(20),
    address          TEXT,
    -- positive = they owe us (receivable / Debit balance)
    -- negative = we owe them (payable / Credit balance)
    opening_balance  NUMERIC(15,2) NOT NULL DEFAULT 0,
    current_balance  NUMERIC(15,2) NOT NULL DEFAULT 0,   -- kept in sync by app transactions
    notes            TEXT,
    is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 3. PRODUCTS  (Petrol, Diesel, LPG, CNG, etc.)
-- ============================================================

CREATE TABLE products (
    id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id        UUID          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name              VARCHAR(255)  NOT NULL,
    unit              product_unit  NOT NULL DEFAULT 'ltr',
    current_stock     NUMERIC(15,3) NOT NULL DEFAULT 0,
    selling_rate      NUMERIC(10,2) NOT NULL DEFAULT 0,       -- current selling price/unit
    purchase_rate     NUMERIC(10,2) NOT NULL DEFAULT 0,       -- last purchase price/unit
    avg_purchase_rate NUMERIC(10,2) NOT NULL DEFAULT 0,       -- weighted average cost/unit
    hsn_code          VARCHAR(20),
    low_stock_alert   NUMERIC(15,3) NOT NULL DEFAULT 500,     -- show warning below this qty
    is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    UNIQUE (company_id, name)
);


-- ============================================================
-- 4. MACHINES  (Pump dispensers)
-- ============================================================

CREATE TABLE machines (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id   UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    machine_no   VARCHAR(50)  NOT NULL,               -- e.g. M-001
    product_id   UUID         NOT NULL REFERENCES products(id),
    nozzle_count INTEGER      NOT NULL DEFAULT 2 CHECK (nozzle_count BETWEEN 1 AND 8),
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    UNIQUE (company_id, machine_no)
);


-- ============================================================
-- 5. NOZZLES  (Individual nozzles on a machine)
-- ============================================================

CREATE TABLE nozzles (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    machine_id      UUID          NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    nozzle_no       INTEGER       NOT NULL,             -- 1, 2, 3 …
    current_reading NUMERIC(15,3) NOT NULL DEFAULT 0,  -- cumulative meter reading
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    UNIQUE (machine_id, nozzle_no)
);


-- ============================================================
-- 6. DAILY NOZZLE READINGS  (Shift / day-end meter readings)
-- ============================================================

CREATE TABLE daily_readings (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id       UUID          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reading_date     DATE          NOT NULL,
    nozzle_id        UUID          NOT NULL REFERENCES nozzles(id),
    opening_reading  NUMERIC(15,3) NOT NULL,
    closing_reading  NUMERIC(15,3) NOT NULL,
    testing_quantity NUMERIC(15,3) NOT NULL DEFAULT 0,
    quantity_sold    NUMERIC(15,3) NOT NULL DEFAULT 0,  -- app calculates: closing - opening - testing
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    UNIQUE (nozzle_id, reading_date)
);


-- ============================================================
-- 7. SALES
-- ============================================================

CREATE TABLE sales (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id   UUID          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sale_date    DATE          NOT NULL,
    product_id   UUID          NOT NULL REFERENCES products(id),
    account_id   UUID          REFERENCES accounts(id),   -- NULL = walk-in cash customer
    nozzle_id    UUID          REFERENCES nozzles(id),    -- optional: which nozzle
    quantity     NUMERIC(15,3) NOT NULL CHECK (quantity > 0),
    rate         NUMERIC(10,2) NOT NULL CHECK (rate > 0),
    total_amount NUMERIC(15,2) NOT NULL,                  -- quantity * rate (app calculates)
    payment_mode payment_mode  NOT NULL DEFAULT 'cash',
    note         TEXT,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 8. PURCHASES
-- ============================================================

CREATE TABLE purchases (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id    UUID          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    purchase_date DATE          NOT NULL,
    product_id    UUID          NOT NULL REFERENCES products(id),
    account_id    UUID          REFERENCES accounts(id),  -- supplier; NULL = cash purchase
    quantity      NUMERIC(15,3) NOT NULL CHECK (quantity > 0),
    rate          NUMERIC(10,2) NOT NULL CHECK (rate > 0),
    total_amount  NUMERIC(15,2) NOT NULL,                 -- quantity * rate (app calculates)
    payment_mode  payment_mode  NOT NULL DEFAULT 'cash',
    invoice_no    VARCHAR(100),
    note          TEXT,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 9. CASH VOUCHERS  (Receipts & Payments)
-- ============================================================

CREATE TABLE vouchers (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id   UUID          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    voucher_type voucher_type  NOT NULL,                  -- 'receipt' | 'payment'
    account_id   UUID          NOT NULL REFERENCES accounts(id),
    amount       NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    voucher_date DATE          NOT NULL,
    description  TEXT,
    reference_no VARCHAR(100),
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 10. EXPENSE CATEGORIES
-- ============================================================

CREATE TABLE expense_categories (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    UNIQUE (company_id, name)
);


-- ============================================================
-- 11. EXPENSES
-- ============================================================

CREATE TABLE expenses (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id   UUID          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    expense_date DATE          NOT NULL,
    category_id  UUID          REFERENCES expense_categories(id),
    description  TEXT          NOT NULL,
    amount       NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    payment_mode payment_mode  NOT NULL DEFAULT 'cash',
    account_id   UUID          REFERENCES accounts(id),  -- if paid through an account
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 12. RATE ADJUSTMENTS  (Full price-change history per product)
-- ============================================================

CREATE TABLE rate_adjustments (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id      UUID          NOT NULL REFERENCES products(id),
    old_rate        NUMERIC(10,2) NOT NULL,
    new_rate        NUMERIC(10,2) NOT NULL,
    adjustment_date DATE          NOT NULL,
    reason          TEXT,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 13. STOCK ADJUSTMENTS  (Manual stock corrections / additions)
-- ============================================================

CREATE TABLE stock_adjustments (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID           NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id      UUID           NOT NULL REFERENCES products(id),
    adjustment_type stock_adj_type NOT NULL,
    quantity        NUMERIC(15,3)  NOT NULL CHECK (quantity > 0),
    previous_stock  NUMERIC(15,3)  NOT NULL,
    new_stock       NUMERIC(15,3)  NOT NULL,
    reason          TEXT,
    adjustment_date DATE           NOT NULL,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 14. ACCOUNT LEDGER  (Running ledger — maintained by app transactions)
--
--  HOW THE APP MUST WRITE THIS (no triggers, so app handles it):
--
--  CREDIT SALE:
--    BEGIN
--      INSERT INTO sales ...
--      UPDATE products SET current_stock = current_stock - qty WHERE id = product_id
--      INSERT INTO account_ledger (entry_type='sale', debit=total_amount, balance=prev+total)
--      UPDATE accounts SET current_balance = current_balance + total_amount
--    COMMIT
--
--  PURCHASE (from supplier on credit):
--    BEGIN
--      INSERT INTO purchases ...
--      new_avg = ((current_stock * avg_purchase_rate) + (qty * rate)) / (current_stock + qty)
--      UPDATE products SET current_stock = current_stock + qty, avg_purchase_rate = new_avg
--      INSERT INTO account_ledger (entry_type='purchase', credit=total_amount, balance=prev-total)
--      UPDATE accounts SET current_balance = current_balance - total_amount
--    COMMIT
--
--  CASH RECEIPT (money received from customer):
--    BEGIN
--      INSERT INTO vouchers (type='receipt') ...
--      INSERT INTO account_ledger (entry_type='cash_receipt', credit=amount, balance=prev-amount)
--      UPDATE accounts SET current_balance = current_balance - amount
--    COMMIT
--
--  CASH PAYMENT (money paid to supplier):
--    BEGIN
--      INSERT INTO vouchers (type='payment') ...
--      INSERT INTO account_ledger (entry_type='cash_payment', debit=amount, balance=prev+amount)
--      UPDATE accounts SET current_balance = current_balance + amount
--    COMMIT
-- ============================================================

CREATE TABLE account_ledger (
    id              UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID               NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    account_id      UUID               NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    entry_date      DATE               NOT NULL,
    entry_type      ledger_entry_type  NOT NULL,
    reference_id    UUID,                                    -- FK to sales/purchases/vouchers/expenses
    reference_table ledger_ref_table,                        -- which table reference_id points to
    description     TEXT,
    debit           NUMERIC(15,2)      NOT NULL DEFAULT 0,   -- money OWED TO US  (Dr)
    credit          NUMERIC(15,2)      NOT NULL DEFAULT 0,   -- money WE OWE THEM (Cr)
    balance         NUMERIC(15,2)      NOT NULL,             -- running balance after this entry
    created_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);


-- ============================================================
-- INDEXES  (Performance)
-- ============================================================

CREATE INDEX idx_companies_pump_code   ON companies(pump_code);
CREATE INDEX idx_accounts_company      ON accounts(company_id);
CREATE INDEX idx_accounts_type         ON accounts(company_id, type);
CREATE INDEX idx_products_company      ON products(company_id);
CREATE INDEX idx_machines_company      ON machines(company_id);
CREATE INDEX idx_machines_product      ON machines(product_id);
CREATE INDEX idx_nozzles_machine       ON nozzles(machine_id);
CREATE INDEX idx_nozzles_company       ON nozzles(company_id);
CREATE INDEX idx_readings_company_date ON daily_readings(company_id, reading_date);
CREATE INDEX idx_readings_nozzle       ON daily_readings(nozzle_id);
CREATE INDEX idx_sales_company         ON sales(company_id);
CREATE INDEX idx_sales_date            ON sales(company_id, sale_date);
CREATE INDEX idx_sales_product         ON sales(product_id);
CREATE INDEX idx_sales_account         ON sales(account_id);
CREATE INDEX idx_sales_payment         ON sales(company_id, payment_mode);
CREATE INDEX idx_purchases_company     ON purchases(company_id);
CREATE INDEX idx_purchases_date        ON purchases(company_id, purchase_date);
CREATE INDEX idx_purchases_product     ON purchases(product_id);
CREATE INDEX idx_purchases_account     ON purchases(account_id);
CREATE INDEX idx_vouchers_company      ON vouchers(company_id);
CREATE INDEX idx_vouchers_date         ON vouchers(company_id, voucher_date);
CREATE INDEX idx_vouchers_account      ON vouchers(account_id);
CREATE INDEX idx_vouchers_type         ON vouchers(company_id, voucher_type);
CREATE INDEX idx_expenses_company      ON expenses(company_id);
CREATE INDEX idx_expenses_date         ON expenses(company_id, expense_date);
CREATE INDEX idx_expenses_category     ON expenses(category_id);
CREATE INDEX idx_rate_adj_product      ON rate_adjustments(product_id);
CREATE INDEX idx_rate_adj_company      ON rate_adjustments(company_id);
CREATE INDEX idx_stock_adj_product     ON stock_adjustments(product_id);
CREATE INDEX idx_stock_adj_company     ON stock_adjustments(company_id);
CREATE INDEX idx_ledger_account        ON account_ledger(account_id);
CREATE INDEX idx_ledger_company_date   ON account_ledger(company_id, entry_date);
CREATE INDEX idx_ledger_reference      ON account_ledger(reference_id);


-- ============================================================
-- DEFAULT SEED: Expense Categories
-- Run after registering a company — replace <company_id> with the real UUID
-- ============================================================

-- INSERT INTO expense_categories (company_id, name) VALUES
--   ('<company_id>', 'Salaries'),
--   ('<company_id>', 'Electricity'),
--   ('<company_id>', 'Fuel for Generator'),
--   ('<company_id>', 'Maintenance & Repair'),
--   ('<company_id>', 'Rent'),
--   ('<company_id>', 'Office Supplies'),
--   ('<company_id>', 'Transport'),
--   ('<company_id>', 'Miscellaneous');


-- ============================================================
-- DEFAULT SEED: Products  (common Pakistan pump products)
-- Run after registering a company — replace <company_id> with the real UUID
-- ============================================================

-- INSERT INTO products (company_id, name, unit) VALUES
--   ('<company_id>', 'Petrol',           'ltr'),
--   ('<company_id>', 'Hi Speed Diesel',  'ltr'),
--   ('<company_id>', 'Super Petrol',     'ltr'),
--   ('<company_id>', 'Hi Octane Petrol', 'ltr'),
--   ('<company_id>', 'Light Diesel Oil', 'ltr'),
--   ('<company_id>', 'Kerosene Oil',     'ltr'),
--   ('<company_id>', 'LPG',              'kg'),
--   ('<company_id>', 'CNG',              'cubic_meter');


-- ============================================================
-- TABLE SUMMARY  (14 tables total)
-- ============================================================
--
--  companies           → one row per pump station + login credentials
--  accounts            → customers / suppliers / employees / others
--  products            → fuel & other inventory with stock & rates
--  machines            → pump dispensers
--  nozzles             → individual nozzles per machine
--  daily_readings      → shift/day-end meter readings per nozzle
--  sales               → every sale transaction
--  purchases           → every purchase / stock-in transaction
--  vouchers            → cash receipts & payments
--  expense_categories  → salaries, rent, electricity …
--  expenses            → all operating expenses
--  rate_adjustments    → complete price-change history per product
--  stock_adjustments   → manual stock corrections
--  account_ledger      → full running ledger per account
--
--  LOGIN  : pump_code + email + password  →  companies table only
--  NO RLS : enforce company_id in every query at the app layer
--  NO TRIGGERS : all side-effects handled in app-level transactions
--  TRANSACTIONS : every multi-table write MUST use BEGIN / COMMIT
-- ============================================================
