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
                getARDashboard();
                break;
            case 'customers':
                getARCustomers();
                break;
            case 'payments':
                getARPayments();
                break;
            default:
                sendJSONResponse(['error' => 'Invalid endpoint'], 404);
        }
        break;
        
    case 'POST':
        switch ($endpoint) {
            case 'payment':
                createARPayment();
                break;
            case 'invoice':
                createARInvoice();
                break;
            case 'customer':
                createCustomer();
                break;
            default:
                sendJSONResponse(['error' => 'Invalid endpoint'], 404);
        }
        break;
        
    default:
        sendJSONResponse(['error' => 'Method not allowed'], 405);
}

function getARDashboard() {
    global $pdo;
    
    try {
        // Get AR summary data
        $sql = "SELECT 
                    COUNT(*) as total_invoices,
                    SUM(balance_amount) as total_outstanding,
                    COUNT(CASE WHEN DATEDIFF(CURDATE(), due_date) > 0 THEN 1 END) as overdue_count,
                    SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) > 0 THEN balance_amount ELSE 0 END) as overdue_amount,
                    SUM(CASE WHEN MONTH(invoice_date) = MONTH(CURDATE()) AND YEAR(invoice_date) = YEAR(CURDATE()) THEN total_amount ELSE 0 END) as expected_this_month,
                    SUM(CASE WHEN MONTH(payment_date) = MONTH(CURDATE()) AND YEAR(payment_date) = YEAR(CURDATE()) THEN payment_amount ELSE 0 END) as collected_this_month
                FROM ar_invoices i
                LEFT JOIN ar_payments p ON i.invoice_id = p.invoice_id
                WHERE i.balance_amount > 0";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $summary = $stmt->fetch();
        
        // Calculate collection progress
        $expected = $summary['expected_this_month'] ?? 0;
        $collected = $summary['collected_this_month'] ?? 0;
        $progress = $expected > 0 ? round(($collected / $expected) * 100, 1) : 0;
        
        $summary['collection_progress'] = $progress;
        $summary['collected_this_month'] = formatCurrency($collected);
        $summary['expected_this_month'] = formatCurrency($expected);
        
        sendJSONResponse(['success' => true, 'data' => $summary]);
    } catch (Exception $e) {
        sendJSONResponse(['error' => $e->getMessage()], 500);
    }
}

function getARCustomers() {
    global $pdo;
    
    try {
        $sql = "SELECT * FROM customers WHERE status = 'active' ORDER BY customer_name";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $customers = $stmt->fetchAll();
        
        sendJSONResponse(['success' => true, 'data' => $customers]);
    } catch (Exception $e) {
        sendJSONResponse(['error' => $e->getMessage()], 500);
    }
}

function getARPayments() {
    global $pdo;
    
    try {
        $sql = "SELECT 
                    p.*,
                    i.invoice_number,
                    c.customer_name
                FROM ar_payments p
                JOIN ar_invoices i ON p.invoice_id = i.invoice_id
                JOIN customers c ON i.customer_id = c.customer_id
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

function createARPayment() {
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
        $sql = "INSERT INTO ar_payments (invoice_id, payment_date, payment_amount, payment_method, reference_number, notes) 
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
        $sql = "UPDATE ar_invoices 
                SET paid_amount = (
                    SELECT COALESCE(SUM(payment_amount), 0) 
                    FROM ar_payments 
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

function createARInvoice() {
    global $pdo;
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $requiredFields = ['customer_id', 'invoice_number', 'invoice_date', 'due_date', 'total_amount'];
        $missing = validateRequiredFields($input, $requiredFields);
        
        if (!empty($missing)) {
            sendJSONResponse(['error' => 'Missing required fields: ' . implode(', ', $missing)], 400);
        }
        
        $sql = "INSERT INTO ar_invoices (customer_id, invoice_number, invoice_date, due_date, total_amount, description, reference_number) 
                VALUES (:customer_id, :invoice_number, :invoice_date, :due_date, :total_amount, :description, :reference_number)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'customer_id' => $input['customer_id'],
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

function createCustomer() {
    global $pdo;
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $requiredFields = ['customer_name'];
        $missing = validateRequiredFields($input, $requiredFields);
        
        if (!empty($missing)) {
            sendJSONResponse(['error' => 'Missing required fields: ' . implode(', ', $missing)], 400);
        }
        
        $sql = "INSERT INTO customers (customer_name, contact_person, email, phone, address, tax_id, payment_terms, credit_limit) 
                VALUES (:customer_name, :contact_person, :email, :phone, :address, :tax_id, :payment_terms, :credit_limit)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'customer_name' => $input['customer_name'],
            'contact_person' => $input['contact_person'] ?? null,
            'email' => $input['email'] ?? null,
            'phone' => $input['phone'] ?? null,
            'address' => $input['address'] ?? null,
            'tax_id' => $input['tax_id'] ?? null,
            'payment_terms' => $input['payment_terms'] ?? 30,
            'credit_limit' => $input['credit_limit'] ?? 0.00
        ]);
        
        sendJSONResponse(['success' => true, 'message' => 'Customer created successfully']);
    } catch (Exception $e) {
        sendJSONResponse(['error' => $e->getMessage()], 500);
    }
}
?> 