<?php
require_once 'config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    sendJSONResponse(['error' => 'Method not allowed'], 405);
}

try {
    // Get the top customer (highest outstanding balance)
    $sql = "SELECT 
                c.customer_id,
                c.customer_name,
                c.contact_person,
                c.email,
                c.phone,
                c.address,
                c.payment_terms,
                c.credit_limit,
                SUM(ar.balance_amount) as total_outstanding,
                COUNT(ar.invoice_id) as total_invoices,
                MAX(ar.due_date) as latest_due_date,
                MIN(ar.due_date) as earliest_due_date,
                DATEDIFF(CURDATE(), MAX(ar.due_date)) as days_overdue,
                SUM(ar.total_amount) as total_invoiced,
                SUM(ar.paid_amount) as total_paid
            FROM customers c
            INNER JOIN ar_invoices ar ON c.customer_id = ar.customer_id
            WHERE ar.balance_amount > 0 
              AND ar.due_date < CURDATE()
            GROUP BY c.customer_id, c.customer_name, c.contact_person, c.email, c.phone, c.address, c.payment_terms, c.credit_limit
            ORDER BY total_outstanding DESC
            LIMIT 1";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $topCustomer = $stmt->fetch();
    
    if (!$topCustomer) {
        sendJSONResponse(['success' => false, 'message' => 'No at-risk customers found']);
        return;
    }
    
    // Get detailed invoice breakdown for this customer
    $sql2 = "SELECT 
                invoice_id,
                invoice_number,
                invoice_date,
                due_date,
                total_amount,
                paid_amount,
                balance_amount,
                DATEDIFF(CURDATE(), due_date) as days_overdue,
                description
            FROM ar_invoices
            WHERE customer_id = :customer_id AND balance_amount > 0
            ORDER BY due_date ASC";
    
    $stmt2 = $pdo->prepare($sql2);
    $stmt2->execute(['customer_id' => $topCustomer['customer_id']]);
    $invoices = $stmt2->fetchAll();
    
    // Get payment history for this customer
    $sql3 = "SELECT 
                p.payment_date,
                p.payment_amount,
                p.payment_method,
                p.reference_number,
                i.invoice_number
            FROM ar_payments p
            JOIN ar_invoices i ON p.invoice_id = i.invoice_id
            WHERE i.customer_id = :customer_id
            ORDER BY p.payment_date DESC
            LIMIT 10";
    
    $stmt3 = $pdo->prepare($sql3);
    $stmt3->execute(['customer_id' => $topCustomer['customer_id']]);
    $paymentHistory = $stmt3->fetchAll();
    
    $response = [
        'success' => true,
        'customer_details' => $topCustomer,
        'outstanding_invoices' => $invoices,
        'payment_history' => $paymentHistory
    ];
    
    sendJSONResponse($response);
    
} catch (Exception $e) {
    sendJSONResponse(['error' => $e->getMessage()], 500);
}
?>