<?php
require_once 'config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    sendJSONResponse(['error' => 'Method not allowed'], 405);
}

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
    
    // Get collection metrics
    $sql2 = "SELECT 
                SUM(CASE WHEN ar.due_date < CURDATE() THEN ar.balance_amount ELSE 0 END) as overdue_amount,
                SUM(ar.balance_amount) as total_receivables,
                SUM(CASE WHEN ar.due_date >= CURDATE() THEN ar.balance_amount ELSE 0 END) as current_amount
              FROM ar_invoices ar
              WHERE ar.balance_amount > 0";
    
    $stmt2 = $pdo->prepare($sql2);
    $stmt2->execute();
    $collectionMetrics = $stmt2->fetch();
    
    // Calculate collection progress
    $totalReceivables = $collectionMetrics['total_receivables'] ?? 0;
    $overdueAmount = $collectionMetrics['overdue_amount'] ?? 0;
    $currentAmount = $collectionMetrics['current_amount'] ?? 0;
    
    // Simulate collected amount (in real system, this would come from payments table)
    $collectedAmount = $totalReceivables * 0.8; // 80% collection rate
    $expectedAmount = $totalReceivables;
    $progressPercentage = ($collectedAmount / $expectedAmount) * 100;
    
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
?> 