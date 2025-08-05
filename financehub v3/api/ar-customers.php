<?php
require_once 'config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    getAtRiskCustomersAndMetrics();
} elseif ($method === 'POST') {
    addPayment();
} else {
    sendJSONResponse(['error' => 'Method not allowed'], 405);
}

function addPayment() {
    global $pdo;
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['amount']) || !is_numeric($input['amount']) || $input['amount'] <= 0) {
            sendJSONResponse(['error' => 'Valid payment amount is required'], 400);
            return;
        }
        
        $amount = floatval($input['amount']);
        $customerId = $input['customer_id'] ?? null;
        $invoiceId = $input['invoice_id'] ?? null;
        
        $pdo->beginTransaction();
        
        // If no specific invoice is provided, apply to oldest outstanding invoice
        if (!$invoiceId && $customerId) {
            $sql = "SELECT invoice_id FROM ar_invoices 
                    WHERE customer_id = :customer_id AND balance_amount > 0 
                    ORDER BY due_date ASC LIMIT 1";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['customer_id' => $customerId]);
            $result = $stmt->fetch();
            $invoiceId = $result['invoice_id'] ?? null;
        }
        
        // If still no invoice, get any outstanding invoice
        if (!$invoiceId) {
            $sql = "SELECT invoice_id FROM ar_invoices 
                    WHERE balance_amount > 0 
                    ORDER BY due_date ASC LIMIT 1";
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetch();
            $invoiceId = $result['invoice_id'] ?? null;
        }
        
        if (!$invoiceId) {
            sendJSONResponse(['error' => 'No outstanding invoices found'], 400);
            return;
        }
        
        // Insert payment record
        $sql = "INSERT INTO ar_payments (invoice_id, payment_date, payment_amount, payment_method, reference_number) 
                VALUES (:invoice_id, CURDATE(), :amount, 'Cash', :reference)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'invoice_id' => $invoiceId,
            'amount' => $amount,
            'reference' => 'MANUAL-' . date('YmdHis')
        ]);
        
        // Update invoice paid amount and balance
        $sql = "UPDATE ar_invoices 
                SET paid_amount = paid_amount + :amount,
                    balance_amount = total_amount - (paid_amount + :amount)
                WHERE invoice_id = :invoice_id";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'amount' => $amount,
            'invoice_id' => $invoiceId
        ]);
        
        $pdo->commit();
        
        sendJSONResponse([
            'success' => true, 
            'message' => 'Payment added successfully',
            'payment_amount' => $amount,
            'invoice_id' => $invoiceId
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        sendJSONResponse(['error' => $e->getMessage()], 500);
    }
}

function getAtRiskCustomersAndMetrics() {
    global $pdo;

    try {
        // Get at-risk customers (customers with overdue invoices)
        $sql = "SELECT 
                    c.customer_name,
                    c.customer_id,
                    SUM(ar.balance_amount) as total_balance,
                    COUNT(ar.invoice_number) as invoice_count,
                    MAX(ar.due_date) as latest_due_date,
                    DATEDIFF(CURDATE(), MAX(ar.due_date)) as days_overdue
                  FROM customers c
                  INNER JOIN ar_invoices ar ON c.customer_id = ar.customer_id
                  WHERE ar.balance_amount > 0 
                    AND ar.due_date < CURDATE()
                  GROUP BY c.customer_id, c.customer_name
                  ORDER BY total_balance DESC
                  LIMIT 5";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $atRiskCustomers = $stmt->fetchAll();
        
        // Get collection metrics with real payment data
        $sql2 = "SELECT 
                    SUM(CASE WHEN ar.due_date < CURDATE() THEN ar.balance_amount ELSE 0 END) as overdue_amount,
                    SUM(ar.balance_amount) as total_receivables,
                    SUM(CASE WHEN ar.due_date >= CURDATE() THEN ar.balance_amount ELSE 0 END) as current_amount,
                    SUM(ar.paid_amount) as total_collected,
                    SUM(ar.total_amount) as total_expected
                  FROM ar_invoices ar
                  WHERE ar.status != 'cancelled'";
        
        $stmt2 = $pdo->prepare($sql2);
        $stmt2->execute();
        $collectionMetrics = $stmt2->fetch();
        
        // Calculate collection progress with real data
        $totalReceivables = $collectionMetrics['total_receivables'] ?? 0;
        $overdueAmount = $collectionMetrics['overdue_amount'] ?? 0;
        $currentAmount = $collectionMetrics['current_amount'] ?? 0;
        $collectedAmount = $collectionMetrics['total_collected'] ?? 0;
        $expectedAmount = $collectionMetrics['total_expected'] ?? 0;
        
        $progressPercentage = $expectedAmount > 0 ? ($collectedAmount / $expectedAmount) * 100 : 0;
        
        $response = [
            'success' => true,
            'at_risk_customers' => $atRiskCustomers,
            'collection_metrics' => [
                'collected_amount' => $collectedAmount,
                'expected_amount' => $expectedAmount,
                'progress_percentage' => round($progressPercentage, 1),
                'overdue_amount' => $overdueAmount,
                'current_amount' => $currentAmount
            ]
        ];
        
        sendJSONResponse($response);
        
    } catch (Exception $e) {
        sendJSONResponse(['error' => $e->getMessage()], 500);
    }
}
?> 