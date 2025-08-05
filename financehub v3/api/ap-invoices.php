<?php
require_once 'config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    sendJSONResponse(['error' => 'Method not allowed'], 405);
}

try {
    // Get AP invoices with vendor information
    $sql = "SELECT 
                ap.invoice_number,
                ap.invoice_date,
                ap.due_date,
                ap.total_amount,
                ap.paid_amount,
                ap.balance_amount,
                ap.description,
                v.vendor_name,
                v.vendor_id,
                DATEDIFF(CURDATE(), ap.due_date) as days_overdue,
                CASE 
                    WHEN DATEDIFF(CURDATE(), ap.due_date) <= 30 THEN '0-30 days'
                    WHEN DATEDIFF(CURDATE(), ap.due_date) <= 60 THEN '31-60 days'
                    WHEN DATEDIFF(CURDATE(), ap.due_date) <= 90 THEN '61-90 days'
                    ELSE '90+ days'
                END as aging_bucket
              FROM ap_invoices ap
              INNER JOIN vendors v ON ap.vendor_id = v.vendor_id
              WHERE ap.balance_amount >= 0
              ORDER BY ap.due_date DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $apInvoices = $stmt->fetchAll();
    
    // Calculate summary metrics
    $totalOutstanding = 0;
    $overdueCount = 0;
    
    foreach ($apInvoices as $invoice) {
        $totalOutstanding += $invoice['balance_amount'];
        if ($invoice['days_overdue'] > 60) {
            $overdueCount++;
        }
    }
    
    $response = [
        'success' => true,
        'invoices' => $apInvoices,
        'summary' => [
            'total_outstanding' => $totalOutstanding,
            'overdue_count' => $overdueCount,
            'total_invoices' => count($apInvoices)
        ]
    ];
    
    sendJSONResponse($response);
    
} catch (Exception $e) {
    sendJSONResponse(['error' => $e->getMessage()], 500);
}
?> 