<?php
require_once 'config.php';

$pdo = getDBConnection();

try {
    $sql = "SELECT 
                CASE 
                    WHEN DATEDIFF(CURDATE(), due_date) <= 0 THEN 'Current'
                    WHEN DATEDIFF(CURDATE(), due_date) <= 30 THEN '1-30 days'
                    WHEN DATEDIFF(CURDATE(), due_date) <= 60 THEN '31-60 days'
                    WHEN DATEDIFF(CURDATE(), due_date) <= 90 THEN '61-90 days'
                    ELSE 'Over 90 days'
                END as aging_bucket,
                COUNT(*) as invoice_count,
                SUM(balance_amount) as total_amount
            FROM ar_invoices 
            WHERE balance_amount > 0
            GROUP BY aging_bucket
            ORDER BY 
                CASE aging_bucket
                    WHEN 'Current' THEN 1
                    WHEN '1-30 days' THEN 2
                    WHEN '31-60 days' THEN 3
                    WHEN '61-90 days' THEN 4
                    WHEN 'Over 90 days' THEN 5
                END";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $aging = $stmt->fetchAll();
    
    sendJSONResponse(['success' => true, 'data' => $aging]);
} catch (Exception $e) {
    sendJSONResponse(['error' => $e->getMessage()], 500);
}
?> 