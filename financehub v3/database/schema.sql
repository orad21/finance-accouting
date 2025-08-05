-- FinanceHub Database Schema
-- Accounts Payable and Receivable Management System

-- Create database
CREATE DATABASE IF NOT EXISTS financehub;
USE financehub;

-- Vendors table (for Accounts Payable)
CREATE TABLE vendors (
    vendor_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    tax_id VARCHAR(50),
    payment_terms INT DEFAULT 30,
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Customers table (for Accounts Receivable)
CREATE TABLE customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    tax_id VARCHAR(50),
    payment_terms INT DEFAULT 30,
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Chart of Accounts
CREATE TABLE chart_of_accounts (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type ENUM('asset', 'liability', 'equity', 'revenue', 'expense') NOT NULL,
    parent_account_id INT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_account_id) REFERENCES chart_of_accounts(account_id)
);

-- Accounts Payable Invoices
CREATE TABLE ap_invoices (
    invoice_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0.00,
    balance_amount DECIMAL(15,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    status ENUM('open', 'partial', 'paid', 'overdue') DEFAULT 'open',
    description TEXT,
    reference_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id),
    UNIQUE KEY unique_invoice (vendor_id, invoice_number)
);

-- Accounts Receivable Invoices
CREATE TABLE ar_invoices (
    invoice_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0.00,
    balance_amount DECIMAL(15,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    status ENUM('open', 'partial', 'paid', 'overdue') DEFAULT 'open',
    description TEXT,
    reference_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    UNIQUE KEY unique_invoice (customer_id, invoice_number)
);

-- AP Payments
CREATE TABLE ap_payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    payment_date DATE NOT NULL,
    payment_amount DECIMAL(15,2) NOT NULL,
    payment_method ENUM('check', 'wire', 'ach', 'credit_card', 'cash') NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES ap_invoices(invoice_id)
);

-- AR Payments
CREATE TABLE ar_payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    payment_date DATE NOT NULL,
    payment_amount DECIMAL(15,2) NOT NULL,
    payment_method ENUM('check', 'wire', 'ach', 'credit_card', 'cash') NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES ar_invoices(invoice_id)
);

-- General Ledger Transactions
CREATE TABLE gl_transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_date DATE NOT NULL,
    account_id INT NOT NULL,
    debit_amount DECIMAL(15,2) DEFAULT 0.00,
    credit_amount DECIMAL(15,2) DEFAULT 0.00,
    description TEXT,
    reference_type ENUM('ap_invoice', 'ar_invoice', 'ap_payment', 'ar_payment', 'manual') NOT NULL,
    reference_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(account_id)
);

-- Insert sample data for Chart of Accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_type) VALUES
('1000', 'Cash', 'asset'),
('1100', 'Accounts Receivable', 'asset'),
('1200', 'Inventory', 'asset'),
('2000', 'Accounts Payable', 'liability'),
('2100', 'Accrued Expenses', 'liability'),
('3000', 'Common Stock', 'equity'),
('4000', 'Sales Revenue', 'revenue'),
('5000', 'Cost of Goods Sold', 'expense'),
('5100', 'Operating Expenses', 'expense');

-- Insert sample vendors
INSERT INTO vendors (vendor_name, contact_person, email, phone, address, payment_terms) VALUES
('ABC Supplies Co.', 'John Smith', 'john@abcsupplies.com', '555-0101', '123 Business St, City, State', 30),
('XYZ Manufacturing', 'Sarah Johnson', 'sarah@xyzmanufacturing.com', '555-0202', '456 Industrial Ave, City, State', 45),
('Office Solutions Inc.', 'Mike Davis', 'mike@officesolutions.com', '555-0303', '789 Office Blvd, City, State', 30),
('Tech Equipment Ltd.', 'Lisa Wilson', 'lisa@techequipment.com', '555-0404', '321 Tech Drive, City, State', 60);

-- Insert sample customers
INSERT INTO customers (customer_name, contact_person, email, phone, address, payment_terms) VALUES
('Global Enterprises', 'Robert Brown', 'robert@globalenterprises.com', '555-1001', '100 Corporate Plaza, City, State', 30),
('Local Business LLC', 'Jennifer White', 'jennifer@localbusiness.com', '555-1002', '200 Main Street, City, State', 45),
('Startup Innovations', 'David Lee', 'david@startupinnovations.com', '555-1003', '300 Innovation Way, City, State', 30),
('Regional Corp', 'Amanda Garcia', 'amanda@regionalcorp.com', '555-1004', '400 Regional Center, City, State', 60);

-- Insert sample AP invoices
INSERT INTO ap_invoices (vendor_id, invoice_number, invoice_date, due_date, total_amount, description) VALUES
(1, 'INV-001', '2024-01-15', '2024-02-14', 2500.00, 'Office supplies'),
(1, 'INV-002', '2024-01-20', '2024-02-19', 1800.00, 'Computer equipment'),
(2, 'INV-003', '2024-01-10', '2024-02-24', 3500.00, 'Manufacturing materials'),
(3, 'INV-004', '2024-01-25', '2024-02-24', 1200.00, 'Office furniture'),
(4, 'INV-005', '2024-01-05', '2024-03-06', 4200.00, 'IT equipment');

-- Insert sample AR invoices
INSERT INTO ar_invoices (customer_id, invoice_number, invoice_date, due_date, total_amount, description) VALUES
(1, 'AR-001', '2024-01-10', '2024-02-09', 5000.00, 'Consulting services'),
(1, 'AR-002', '2024-01-15', '2024-02-14', 3200.00, 'Software license'),
(2, 'AR-003', '2024-01-20', '2024-02-19', 1800.00, 'Training services'),
(3, 'AR-004', '2024-01-25', '2024-02-24', 4500.00, 'Project implementation'),
(4, 'AR-005', '2024-01-30', '2024-02-29', 2800.00, 'Support services');

-- Insert sample payments
INSERT INTO ap_payments (invoice_id, payment_date, payment_amount, payment_method, reference_number) VALUES
(1, '2024-02-10', 2500.00, 'check', 'CHK-001'),
(2, '2024-02-15', 1800.00, 'wire', 'WIRE-001');

INSERT INTO ar_payments (invoice_id, payment_date, payment_amount, payment_method, reference_number) VALUES
(1, '2024-02-05', 5000.00, 'check', 'AR-CHK-001'),
(2, '2024-02-10', 3200.00, 'wire', 'AR-WIRE-001');

-- Update invoice paid amounts based on payments
UPDATE ap_invoices SET paid_amount = (
    SELECT COALESCE(SUM(payment_amount), 0) 
    FROM ap_payments 
    WHERE ap_payments.invoice_id = ap_invoices.invoice_id
);

UPDATE ar_invoices SET paid_amount = (
    SELECT COALESCE(SUM(payment_amount), 0) 
    FROM ar_payments 
    WHERE ar_payments.invoice_id = ar_invoices.invoice_id
);

-- Create indexes for better performance
CREATE INDEX idx_ap_invoices_vendor ON ap_invoices(vendor_id);
CREATE INDEX idx_ap_invoices_status ON ap_invoices(status);
CREATE INDEX idx_ap_invoices_due_date ON ap_invoices(due_date);
CREATE INDEX idx_ar_invoices_customer ON ar_invoices(customer_id);
CREATE INDEX idx_ar_invoices_status ON ar_invoices(status);
CREATE INDEX idx_ar_invoices_due_date ON ar_invoices(due_date);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_customers_status ON customers(status); 