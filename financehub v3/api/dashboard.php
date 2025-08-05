<?php
require_once 'config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    sendJSONResponse(['error' => 'Method not allowed'], 405);
}

try {
    // Get AP data
    $sql1 = "SELECT 
                SUM(balance_amount) as total_outstanding,
                COUNT(*) as invoice_count,
                SUM(CASE WHEN due_date < CURDATE() THEN balance_amount ELSE 0 END) as overdue_amount,
                COUNT(CASE WHEN due_date < CURDATE() THEN 1 END) as overdue_count
              FROM ap_invoices 
              WHERE balance_amount > 0";
    $stmt1 = $pdo->prepare($sql1);
    $stmt1->execute();
    $apData = $stmt1->fetch();
    
    // Get AR data
    $sql2 = "SELECT 
                SUM(balance_amount) as total_outstanding,
                COUNT(*) as invoice_count,
                SUM(CASE WHEN due_date < CURDATE() THEN balance_amount ELSE 0 END) as overdue_amount,
                COUNT(CASE WHEN due_date < CURDATE() THEN 1 END) as overdue_count
              FROM ar_invoices 
              WHERE balance_amount > 0";
    $stmt2 = $pdo->prepare($sql2);
    $stmt2->execute();
    $arData = $stmt2->fetch();
    
    // Get cash balance (simplified - in real system this would come from GL)
    $sql3 = "SELECT 
                (SELECT COALESCE(SUM(payment_amount), 0) FROM ar_payments WHERE payment_date >= CURDATE() - INTERVAL 30 DAY) as cash_inflow,
                (SELECT COALESCE(SUM(payment_amount), 0) FROM ap_payments WHERE payment_date >= CURDATE() - INTERVAL 30 DAY) as cash_outflow";
    $stmt3 = $pdo->prepare($sql3);
    $stmt3->execute();
    $cashData = $stmt3->fetch();
    
    // Calculate cash balance (starting with a base amount)
    $baseCash = 100000; // Starting cash balance
    $cashBalance = $baseCash + $cashData['cash_inflow'] - $cashData['cash_outflow'];
    
    // Get transaction count for today
    $sql4 = "SELECT 
                (SELECT COUNT(*) FROM ar_payments WHERE DATE(payment_date) = CURDATE()) as ar_payments_today,
                (SELECT COUNT(*) FROM ap_payments WHERE DATE(payment_date) = CURDATE()) as ap_payments_today,
                (SELECT COUNT(*) FROM ar_invoices WHERE DATE(invoice_date) = CURDATE()) as ar_invoices_today,
                (SELECT COUNT(*) FROM ap_invoices WHERE DATE(invoice_date) = CURDATE()) as ap_invoices_today";
    $stmt4 = $pdo->prepare($sql4);
    $stmt4->execute();
    $transactionData = $stmt4->fetch();
    
    $totalTransactionsToday = $transactionData['ar_payments_today'] + $transactionData['ap_payments_today'] + 
                             $transactionData['ar_invoices_today'] + $transactionData['ap_invoices_today'];
    
    // Get reconciled amount (simplified - in real system this would be more complex)
    $reconciledAmount = $cashData['cash_inflow'] + $cashData['cash_outflow'];
    
    // Get active accounts count
    $sql5 = "SELECT 
                (SELECT COUNT(*) FROM vendors WHERE status = 'active') as active_vendors,
                (SELECT COUNT(*) FROM customers WHERE status = 'active') as active_customers";
    $stmt5 = $pdo->prepare($sql5);
    $stmt5->execute();
    $accountsData = $stmt5->fetch();
    
    $activeAccounts = $accountsData['active_vendors'] + $accountsData['active_customers'];
    
    // Prepare dashboard data
    $dashboard = [
        'cash_balance' => [
            'amount' => formatCurrency($cashBalance),
            'change' => formatCurrency($cashData['cash_inflow'] - $cashData['cash_outflow']),
            'percentage' => $cashBalance > 0 ? round((($cashData['cash_inflow'] - $cashData['cash_outflow']) / $cashBalance) * 100, 1) : 0
        ],
        'active_accounts' => [
            'count' => $activeAccounts,
            'change' => 0, // This would be calculated based on new accounts this period
            'percentage' => 0
        ],
        'transactions_today' => [
            'amount' => formatCurrency($cashData['cash_inflow'] + $cashData['cash_outflow']),
            'change' => formatCurrency($cashData['cash_inflow'] - $cashData['cash_outflow']),
            'percentage' => 0
        ],
        'reconciled' => [
            'amount' => formatCurrency($reconciledAmount),
            'change' => formatCurrency($reconciledAmount),
            'percentage' => 0
        ],
        'accounts_payable' => [
            'total_outstanding' => formatCurrency($apData['total_outstanding'] ?? 0),
            'overdue_amount' => formatCurrency($apData['overdue_amount'] ?? 0),
            'overdue_count' => $apData['overdue_count'] ?? 0,
            'invoice_count' => $apData['invoice_count'] ?? 0
        ],
        'accounts_receivable' => [
            'total_outstanding' => formatCurrency($arData['total_outstanding'] ?? 0),
            'overdue_amount' => formatCurrency($arData['overdue_amount'] ?? 0),
            'overdue_count' => $arData['overdue_count'] ?? 0,
            'invoice_count' => $arData['invoice_count'] ?? 0
        ],
        'transactions' => [
            'total_today' => $totalTransactionsToday,
            'ar_payments' => $transactionData['ar_payments_today'],
            'ap_payments' => $transactionData['ap_payments_today'],
            'ar_invoices' => $transactionData['ar_invoices_today'],
            'ap_invoices' => $transactionData['ap_invoices_today']
        ]
    ];
    
    sendJSONResponse(['success' => true, 'data' => $dashboard]);
    
} catch (Exception $e) {
    sendJSONResponse(['error' => $e->getMessage()], 500);
}
?> 