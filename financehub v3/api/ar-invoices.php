<?php
require_once 'config.php';

$pdo = getDBConnection();

try {
    $sql = "SELECT 
                i.*,
                c.customer_name,
                c.contact_person,
                c.email,
                c.phone,
                DATEDIFF(CURDATE(), i.due_date) as days_overdue
            FROM ar_invoices i
            JOIN customers c ON i.customer_id = c.customer_id
            WHERE c.status = 'active'
            ORDER BY i.due_date ASC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $invoices = $stmt->fetchAll();
    
    // Update status based on days overdue
    foreach ($invoices as &$invoice) {
        if ($invoice['balance_amount'] > 0 && $invoice['days_overdue'] > 0) {
            $invoice['status'] = 'overdue';
        }
    }
    
    sendJSONResponse(['success' => true, 'data' => $invoices]);
} catch (Exception $e) {
    sendJSONResponse(['error' => $e->getMessage()], 500);
}
?> 