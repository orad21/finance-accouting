<?php
require_once 'config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];
$pathParts = explode('/', trim(parse_url($path, PHP_URL_PATH), '/'));
$endpoint = end($pathParts);

switch ($method) {
    case 'GET':
        switch ($endpoint) {
            case 'dashboard':
                getAPDashboard();
                break;
            case 'vendors':
                getAPVendors();
                break;
            case 'payments':
                getAPPayments();
                break;
            default:
                sendJSONResponse(['error' => 'Invalid endpoint'], 404);
        }
        break;
        
    case 'POST':
        switch ($endpoint) {
            case 'payment':
                createAPPayment();
                break;
            case 'invoice':
                createAPInvoice();
                break;
            case 'vendor':
                createVendor();
                break;
            default:
                sendJSONResponse(['error' => 'Invalid endpoint'], 404);
        }
        break;
        
    default:
        sendJSONResponse(['error' => 'Method not allowed'], 405);
}

function getAPDashboard() {
    global $pdo;
    
    try {
        // Get AP summary data
        $sql = "SELECT 
                    COUNT(*) as total_invoices,
                    SUM(balance_amount) as total_outstanding,
                    COUNT(CASE WHEN DATEDIFF(CURDATE(), due_date) > 0 THEN 1 END) as overdue_count,
                    SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) > 0 THEN balance_amount ELSE 0 END) as overdue_amount
                FROM ap_invoices 
                WHERE balance_amount > 0";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $summary = $stmt->fetch();
        
        sendJSONResponse(['success' => true, 'data' => $summary]);
    } catch (Exception $e) {
        sendJSONResponse(['error' => $e->getMessage()], 500);
    }
}

function getAPVendors() {
    global $pdo;
    
    try {
        $sql = "SELECT * FROM vendors WHERE status = 'active' ORDER BY vendor_name";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $vendors = $stmt->fetchAll();
        
        sendJSONResponse(['success' => true, 'data' => $vendors]);
    } catch (Exception $e) {
        sendJSONResponse(['error' => $e->getMessage()], 500);
    }
}

function getAPPayments() {
    global $pdo;
    
    try {
        $sql = "SELECT 
                    p.*,
                    i.invoice_number,
                    v.vendor_name
                FROM ap_payments p
                JOIN ap_invoices i ON p.invoice_id = i.invoice_id
                JOIN vendors v ON i.vendor_id = v.vendor_id
                ORDER BY p.payment_date DESC
                LIMIT 50";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $payments = $stmt->fetchAll();
        
        sendJSONResponse(['success' => true, 'data' => $payments]);
    } catch (Exception $e) {
        sendJSONResponse(['error' => $e->getMessage()], 500);
    }
}

function createAPPayment() {
    global $pdo;
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $requiredFields = ['invoice_id', 'payment_amount', 'payment_method'];
        $missing = validateRequiredFields($input, $requiredFields);
        
        if (!empty($missing)) {
            sendJSONResponse(['error' => 'Missing required fields: ' . implode(', ', $missing)], 400);
        }
        
        $pdo->beginTransaction();
        
        // Insert payment
        $sql = "INSERT INTO ap_payments (invoice_id, payment_date, payment_amount, payment_method, reference_number, notes) 
                VALUES (:invoice_id, CURDATE(), :payment_amount, :payment_method, :reference_number, :notes)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'invoice_id' => $input['invoice_id'],
            'payment_amount' => $input['payment_amount'],
            'payment_method' => $input['payment_method'],
            'reference_number' => $input['reference_number'] ?? null,
            'notes' => $input['notes'] ?? null
        ]);
        
        // Update invoice paid amount
        $sql = "UPDATE ap_invoices 
                SET paid_amount = (
                    SELECT COALESCE(SUM(payment_amount), 0) 
                    FROM ap_payments 
                    WHERE invoice_id = :invoice_id
                )
                WHERE invoice_id = :invoice_id";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['invoice_id' => $input['invoice_id']]);
        
        $pdo->commit();
        
        sendJSONResponse(['success' => true, 'message' => 'Payment created successfully']);
    } catch (Exception $e) {
        $pdo->rollBack();
        sendJSONResponse(['error' => $e->getMessage()], 500);
    }
}

function createAPInvoice() {
    global $pdo;
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $requiredFields = ['vendor_id', 'invoice_number', 'invoice_date', 'due_date', 'total_amount'];
        $missing = validateRequiredFields($input, $requiredFields);
        
        if (!empty($missing)) {
            sendJSONResponse(['error' => 'Missing required fields: ' . implode(', ', $missing)], 400);
        }
        
        $sql = "INSERT INTO ap_invoices (vendor_id, invoice_number, invoice_date, due_date, total_amount, description, reference_number) 
                VALUES (:vendor_id, :invoice_number, :invoice_date, :due_date, :total_amount, :description, :reference_number)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'vendor_id' => $input['vendor_id'],
            'invoice_number' => $input['invoice_number'],
            'invoice_date' => $input['invoice_date'],
            'due_date' => $input['due_date'],
            'total_amount' => $input['total_amount'],
            'description' => $input['description'] ?? null,
            'reference_number' => $input['reference_number'] ?? null
        ]);
        
        sendJSONResponse(['success' => true, 'message' => 'Invoice created successfully']);
    } catch (Exception $e) {
        sendJSONResponse(['error' => $e->getMessage()], 500);
    }
}

function createVendor() {
    global $pdo;
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $requiredFields = ['vendor_name'];
        $missing = validateRequiredFields($input, $requiredFields);
        
        if (!empty($missing)) {
            sendJSONResponse(['error' => 'Missing required fields: ' . implode(', ', $missing)], 400);
        }
        
        $sql = "INSERT INTO vendors (vendor_name, contact_person, email, phone, address, tax_id, payment_terms, credit_limit) 
                VALUES (:vendor_name, :contact_person, :email, :phone, :address, :tax_id, :payment_terms, :credit_limit)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'vendor_name' => $input['vendor_name'],
            'contact_person' => $input['contact_person'] ?? null,
            'email' => $input['email'] ?? null,
            'phone' => $input['phone'] ?? null,
            'address' => $input['address'] ?? null,
            'tax_id' => $input['tax_id'] ?? null,
            'payment_terms' => $input['payment_terms'] ?? 30,
            'credit_limit' => $input['credit_limit'] ?? 0.00
        ]);
        
        sendJSONResponse(['success' => true, 'message' => 'Vendor created successfully']);
    } catch (Exception $e) {
        sendJSONResponse(['error' => $e->getMessage()], 500);
    }
}
?> 