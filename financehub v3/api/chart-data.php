<?php
require_once 'config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    sendJSONResponse(['error' => 'Method not allowed'], 405);
}

try {
    // Get general ledger data (revenue, expenses, profit) - monthly for last 12 months
    $sql1 = "SELECT 
                DATE_FORMAT(invoice_date, '%Y-%m') as month,
                SUM(CASE WHEN i.invoice_type = 'revenue' THEN i.total_amount ELSE 0 END) as revenue,
                SUM(CASE WHEN i.invoice_type = 'expense' THEN i.total_amount ELSE 0 END) as expenses
              FROM (
                  SELECT invoice_date, total_amount, 'revenue' as invoice_type FROM ar_invoices
                  UNION ALL
                  SELECT invoice_date, total_amount, 'expense' as invoice_type FROM ap_invoices
              ) i
              WHERE invoice_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
              GROUP BY DATE_FORMAT(invoice_date, '%Y-%m')
              ORDER BY month";
    
    $stmt1 = $pdo->prepare($sql1);
    $stmt1->execute();
    $glData = $stmt1->fetchAll();
    
    // Calculate profit for each month
    $generalLedgerData = [];
    foreach ($glData as $row) {
        $revenue = $row['revenue'] ?? 0;
        $expenses = $row['expenses'] ?? 0;
        $profit = $revenue - $expenses;
        
        $generalLedgerData[] = [
            'date' => date('M', strtotime($row['month'] . '-01')),
            'revenue' => $revenue,
            'expenses' => $expenses,
            'profit' => $profit
        ];
    }
    
    // Get travel expense data (categorized expenses) - monthly for last 12 months
    $sql2 = "SELECT 
                DATE_FORMAT(invoice_date, '%Y-%m') as month,
                SUM(CASE WHEN description LIKE '%flight%' OR description LIKE '%airline%' THEN total_amount ELSE 0 END) as flights,
                SUM(CASE WHEN description LIKE '%hotel%' OR description LIKE '%lodging%' THEN total_amount ELSE 0 END) as hotels,
                SUM(CASE WHEN description LIKE '%meal%' OR description LIKE '%food%' OR description LIKE '%dining%' THEN total_amount ELSE 0 END) as meals,
                SUM(CASE WHEN description LIKE '%transport%' OR description LIKE '%taxi%' OR description LIKE '%uber%' OR description LIKE '%lyft%' THEN total_amount ELSE 0 END) as transport
              FROM ap_invoices 
              WHERE invoice_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                AND (description LIKE '%travel%' OR description LIKE '%flight%' OR description LIKE '%hotel%' OR description LIKE '%meal%' OR description LIKE '%transport%')
              GROUP BY DATE_FORMAT(invoice_date, '%Y-%m')
              ORDER BY month";
    
    $stmt2 = $pdo->prepare($sql2);
    $stmt2->execute();
    $travelData = $stmt2->fetchAll();
    
    $travelExpenseData = [];
    foreach ($travelData as $row) {
        $travelExpenseData[] = [
            'month' => date('M', strtotime($row['month'] . '-01')),
            'flights' => $row['flights'] ?? 0,
            'hotels' => $row['hotels'] ?? 0,
            'meals' => $row['meals'] ?? 0,
            'transport' => $row['transport'] ?? 0
        ];
    }
    
    // Get accounts receivable aging data
    $sql3 = "SELECT 
                CASE 
                    WHEN DATEDIFF(CURDATE(), due_date) <= 30 THEN '0-30 days'
                    WHEN DATEDIFF(CURDATE(), due_date) <= 60 THEN '31-60 days'
                    WHEN DATEDIFF(CURDATE(), due_date) <= 90 THEN '61-90 days'
                    ELSE '90+ days'
                END as period,
                SUM(balance_amount) as amount,
                COUNT(*) as count
              FROM ar_invoices 
              WHERE balance_amount > 0
              GROUP BY period
              ORDER BY 
                CASE period
                    WHEN '0-30 days' THEN 1
                    WHEN '31-60 days' THEN 2
                    WHEN '61-90 days' THEN 3
                    WHEN '90+ days' THEN 4
                END";
    
    $stmt3 = $pdo->prepare($sql3);
    $stmt3->execute();
    $arAgingData = $stmt3->fetchAll();
    
    $accountsReceivableData = [];
    foreach ($arAgingData as $row) {
        $accountsReceivableData[] = [
            'period' => $row['period'],
            'amount' => $row['amount'] ?? 0,
            'count' => $row['count'] ?? 0
        ];
    }
    
    // Get accounts payable aging data
    $sql4 = "SELECT 
                CASE 
                    WHEN DATEDIFF(CURDATE(), due_date) <= 30 THEN '0-30 days'
                    WHEN DATEDIFF(CURDATE(), due_date) <= 60 THEN '31-60 days'
                    WHEN DATEDIFF(CURDATE(), due_date) <= 90 THEN '61-90 days'
                    ELSE '90+ days'
                END as period,
                SUM(balance_amount) as amount,
                COUNT(*) as count
              FROM ap_invoices 
              WHERE balance_amount > 0
              GROUP BY period
              ORDER BY 
                CASE period
                    WHEN '0-30 days' THEN 1
                    WHEN '31-60 days' THEN 2
                    WHEN '61-90 days' THEN 3
                    WHEN '90+ days' THEN 4
                END";
    
    $stmt4 = $pdo->prepare($sql4);
    $stmt4->execute();
    $apAgingData = $stmt4->fetchAll();
    
    $accountsPayableData = [];
    foreach ($apAgingData as $row) {
        $accountsPayableData[] = [
            'period' => $row['period'],
            'amount' => $row['amount'] ?? 0,
            'count' => $row['count'] ?? 0
        ];
    }
    
    // Get asset management data (simplified - in real system this would come from asset tables)
    $sql5 = "SELECT 
                'Equipment' as category,
                SUM(CASE WHEN description LIKE '%equipment%' OR description LIKE '%machine%' THEN total_amount ELSE 0 END) as value,
                SUM(CASE WHEN description LIKE '%equipment%' OR description LIKE '%machine%' THEN total_amount * 0.1 ELSE 0 END) as depreciation
              FROM ap_invoices 
              WHERE description LIKE '%equipment%' OR description LIKE '%machine%'
              UNION ALL
              SELECT 
                'Technology' as category,
                SUM(CASE WHEN description LIKE '%computer%' OR description LIKE '%software%' OR description LIKE '%tech%' THEN total_amount ELSE 0 END) as value,
                SUM(CASE WHEN description LIKE '%computer%' OR description LIKE '%software%' OR description LIKE '%tech%' THEN total_amount * 0.2 ELSE 0 END) as depreciation
              FROM ap_invoices 
              WHERE description LIKE '%computer%' OR description LIKE '%software%' OR description LIKE '%tech%'
              UNION ALL
              SELECT 
                'Furniture' as category,
                SUM(CASE WHEN description LIKE '%furniture%' OR description LIKE '%chair%' OR description LIKE '%desk%' THEN total_amount ELSE 0 END) as value,
                SUM(CASE WHEN description LIKE '%furniture%' OR description LIKE '%chair%' OR description LIKE '%desk%' THEN total_amount * 0.15 ELSE 0 END) as depreciation
              FROM ap_invoices 
              WHERE description LIKE '%furniture%' OR description LIKE '%chair%' OR description LIKE '%desk%'";
    
    $stmt5 = $pdo->prepare($sql5);
    $stmt5->execute();
    $assetData = $stmt5->fetchAll();
    
    // Get bank reconciliation data (simplified - monthly cash flow)
    $sql6 = "SELECT 
                DATE_FORMAT(payment_date, '%Y-%m') as month,
                SUM(CASE WHEN p.payment_type = 'inflow' THEN payment_amount ELSE 0 END) as book_balance,
                SUM(CASE WHEN p.payment_type = 'outflow' THEN payment_amount ELSE 0 END) as bank_balance
              FROM (
                  SELECT payment_date, payment_amount, 'inflow' as payment_type FROM ar_payments
                  UNION ALL
                  SELECT payment_date, payment_amount, 'outflow' as payment_type FROM ap_payments
              ) p
              WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
              GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
              ORDER BY month";
    
    $stmt6 = $pdo->prepare($sql6);
    $stmt6->execute();
    $bankData = $stmt6->fetchAll();
    
    $bankReconciliationData = [];
    foreach ($bankData as $row) {
        $bookBalance = $row['book_balance'] ?? 0;
        $bankBalance = $row['bank_balance'] ?? 0;
        $difference = abs($bookBalance - $bankBalance);
        
        $bankReconciliationData[] = [
            'month' => date('M', strtotime($row['month'] . '-01')),
            'book_balance' => $bookBalance,
            'bank_balance' => $bankBalance,
            'difference' => $difference
        ];
    }
    
    // Prepare chart data response
    $chartData = [
        'general_ledger' => $generalLedgerData,
        'travel_expense' => $travelExpenseData,
        'accounts_receivable' => $accountsReceivableData,
        'accounts_payable' => $accountsPayableData,
        'asset_management' => $assetData,
        'bank_reconciliation' => $bankReconciliationData
    ];
    
    sendJSONResponse(['success' => true, 'data' => $chartData]);
    
} catch (Exception $e) {
    sendJSONResponse(['error' => $e->getMessage()], 500);
}
?> 