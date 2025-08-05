// API Configuration
const API_BASE_URL = 'api';

// API Helper Functions
class FinanceAPI {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}/${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Dashboard API calls
    async getDashboardData() {
        return this.makeRequest('dashboard.php');
    }

    async getChartData() {
        return this.makeRequest('chart-data.php');
    }

    // Accounts Payable API calls
    async getAPInvoices() {
        return this.makeRequest('ap-invoices.php');
    }

    async getAPVendors() {
        return this.makeRequest('accounts-payable.php/vendors');
    }

    async getAPPayments() {
        return this.makeRequest('accounts-payable.php/payments');
    }

    async getAPAging() {
        return this.makeRequest('ap-aging.php');
    }

    async getAPDashboard() {
        return this.makeRequest('accounts-payable.php/dashboard');
    }

    async createAPPayment(paymentData) {
        return this.makeRequest('accounts-payable.php/payment', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    }

    async createAPInvoice(invoiceData) {
        return this.makeRequest('accounts-payable.php/invoice', {
            method: 'POST',
            body: JSON.stringify(invoiceData)
        });
    }

    async createVendor(vendorData) {
        return this.makeRequest('accounts-payable.php/vendor', {
            method: 'POST',
            body: JSON.stringify(vendorData)
        });
    }

    // Accounts Receivable API calls
    async getARInvoices() {
        return this.makeRequest('ar-invoices.php');
    }

    async getARCustomers() {
        return this.makeRequest('accounts-receivable.php/customers');
    }

    async getARPayments() {
        return this.makeRequest('accounts-receivable.php/payments');
    }

    async getARAging() {
        return this.makeRequest('ar-aging.php');
    }

    async getARDashboard() {
        return this.makeRequest('accounts-receivable.php/dashboard');
    }

    async getAtRiskCustomers() {
        return this.makeRequest('ar-customers.php');
    }

    async createARPayment(paymentData) {
        return this.makeRequest('accounts-receivable.php/payment', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    }

    async createARInvoice(invoiceData) {
        return this.makeRequest('accounts-receivable.php/invoice', {
            method: 'POST',
            body: JSON.stringify(invoiceData)
        });
    }

    async createCustomer(customerData) {
        return this.makeRequest('accounts-receivable.php/customer', {
            method: 'POST',
            body: JSON.stringify(customerData)
        });
    }
}

// Initialize API
const api = new FinanceAPI();

// Dashboard Data Loading
async function loadDashboardData() {
    try {
        const [dashboardResponse, chartDataResponse] = await Promise.all([
            api.getDashboardData(),
            api.getChartData()
        ]);
        
        if (dashboardResponse.success) {
            updateDashboardMetrics(dashboardResponse.data);
        }
        
        if (chartDataResponse.success) {
            // Update global chart data variables
            generalLedgerData = chartDataResponse.data.general_ledger || [];
            travelExpenseData = chartDataResponse.data.travel_expense || [];
            accountsReceivableData = chartDataResponse.data.accounts_receivable || [];
            accountsPayableData = chartDataResponse.data.accounts_payable || [];
            assetData = chartDataResponse.data.asset_management || [];
            bankReconciliationData = chartDataResponse.data.bank_reconciliation || [];
            
            // Re-initialize charts with real data
            if (typeof initializeCharts === 'function') {
                initializeCharts();
            }
        }
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

function updateDashboardMetrics(data) {
    // Update cash balance
    const cashBalanceElement = document.querySelector('.metrics-card h3');
    if (cashBalanceElement && data.cash_balance) {
        cashBalanceElement.textContent = data.cash_balance.amount;
        
        // Update change indicator
        const changeElement = cashBalanceElement.parentElement.querySelector('small');
        if (changeElement) {
            changeElement.textContent = data.cash_balance.change;
        }
    }

    // Update active accounts
    const activeAccountsElement = document.querySelectorAll('.metrics-card h3')[1];
    if (activeAccountsElement && data.active_accounts) {
        activeAccountsElement.textContent = data.active_accounts.count.toLocaleString();
    }

    // Update transactions today
    const transactionsElement = document.querySelectorAll('.metrics-card h3')[2];
    if (transactionsElement && data.transactions_today) {
        transactionsElement.textContent = data.transactions_today.amount;
    }

    // Update reconciled
    const reconciledElement = document.querySelectorAll('.metrics-card h3')[3];
    if (reconciledElement && data.reconciled) {
        reconciledElement.textContent = data.reconciled.amount;
    }
}

// Accounts Payable Data Loading
async function loadAPData() {
    try {
        const [invoicesResponse, agingResponse, dashboardResponse] = await Promise.all([
            api.getAPInvoices(),
            api.getAPAging(),
            api.getAPDashboard()
        ]);

        if (invoicesResponse.success) {
            updateAPInvoicesTable(invoicesResponse.data);
        }

        if (agingResponse.success) {
            updateAPAgingChart(agingResponse.data);
        }

        if (dashboardResponse.success) {
            updateAPSummary(dashboardResponse.data);
        }
    } catch (error) {
        console.error('Failed to load AP data:', error);
        showNotification('Failed to load accounts payable data', 'error');
    }
}

function updateAPInvoicesTable(invoices) {
    const invoiceList = document.getElementById('invoiceList');
    if (!invoiceList) return;

    invoiceList.innerHTML = '';

    invoices.forEach(invoice => {
        const row = document.createElement('div');
        row.className = 'invoice-row';
        row.innerHTML = `
            <div class="invoice-col">
                <input type="checkbox" class="invoice-checkbox" data-invoice-id="${invoice.invoice_id}" data-amount="${invoice.balance_amount}">
            </div>
            <div class="invoice-col">${invoice.invoice_number}</div>
            <div class="invoice-col">$${parseFloat(invoice.balance_amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
            <div class="invoice-col">${invoice.due_date}</div>
            <div class="invoice-col ${invoice.days_overdue > 0 ? 'text-danger' : ''}">${invoice.days_overdue > 0 ? invoice.days_overdue : 0}</div>
            <div class="invoice-col">${invoice.vendor_name}</div>
        `;
        invoiceList.appendChild(row);
    });

    // Add event listeners for checkboxes
    addInvoiceCheckboxListeners();
}

function updateAPAgingChart(agingData) {
    const ctx = document.getElementById('apAgingChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }

    const labels = agingData.map(item => item.aging_bucket);
    const amounts = agingData.map(item => parseFloat(item.total_amount));

    // Use the same configuration as the dashboard AP chart
    const chartConfig = {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Amount',
                data: amounts,
                backgroundColor: '#ff6b00',
                borderColor: '#ff6b00',
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#333',
                    borderWidth: 1,
                    callbacks: {
                        label: (context) => `$${context.parsed.y.toLocaleString()}`
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: '#333',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#6c757d'
                    }
                },
                y: {
                    grid: {
                        color: '#333',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#6c757d',
                        callback: (value) => '$' + value / 1000 + 'K'
                    }
                }
            }
        }
    };

    new Chart(ctx, chartConfig);
}

function updateAPSummary(data) {
    // Update summary values
    const totalOutstanding = document.getElementById('totalOutstanding');
    if (totalOutstanding) {
        totalOutstanding.textContent = data.total_outstanding;
    }

    const overdueCount = document.getElementById('overdueCount');
    if (overdueCount) {
        overdueCount.textContent = data.overdue_count;
    }
}

// Accounts Receivable Data Loading
async function loadARData() {
    try {
        const [invoicesResponse, agingResponse, dashboardResponse, atRiskResponse] = await Promise.all([
            api.getARInvoices(),
            api.getARAging(),
            api.getARDashboard(),
            api.getAtRiskCustomers()
        ]);

        if (agingResponse.success) {
            updateARAgingChart(agingResponse.data);
        }

        if (dashboardResponse.success) {
            updateARSummary(dashboardResponse.data);
        }

        if (atRiskResponse.success) {
            updateAtRiskCustomers(atRiskResponse.data);
        }
    } catch (error) {
        console.error('Failed to load AR data:', error);
        showNotification('Failed to load accounts receivable data', 'error');
    }
}

function updateARAgingChart(agingData) {
    const ctx = document.getElementById('arAgingChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }

    const labels = agingData.map(item => item.aging_bucket);
    const amounts = agingData.map(item => parseFloat(item.total_amount));

    // Use the same configuration as the dashboard AR chart (doughnut)
    const chartConfig = {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: amounts,
                backgroundColor: ['#22c55e', '#f59e0b', '#ef4444', '#dc2626'],
                borderWidth: 0,
                cutout: '60%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        color: '#ffffff',
                        usePointStyle: true,
                        padding: 15,
                        generateLabels: (chart) => {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    return {
                                        text: `${label}: $${value.toLocaleString()}`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        strokeStyle: data.datasets[0].backgroundColor[i],
                                        lineWidth: 0,
                                        pointStyle: 'circle',
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#333',
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: $${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    };

    new Chart(ctx, chartConfig);
}

function updateARSummary(data) {
    // Update collection metrics
    const collectedAmount = document.getElementById('collectedAmount');
    if (collectedAmount) {
        collectedAmount.textContent = data.collected_this_month;
    }

    const expectedAmount = document.getElementById('expectedAmount');
    if (expectedAmount) {
        expectedAmount.textContent = data.expected_this_month;
    }

    // Update progress bar
    const progressBar = document.getElementById('progressBar');
    const progressPercentage = document.getElementById('progressPercentage');
    if (progressBar && progressPercentage) {
        const percentage = data.collection_progress;
        progressBar.style.width = percentage + '%';
        progressPercentage.textContent = percentage + '%';
    }
}

function updateAtRiskCustomers(customers) {
    const customerList = document.getElementById('customerList');
    if (!customerList) return;

    customerList.innerHTML = '';

    customers.forEach((customer, index) => {
        const row = document.createElement('div');
        row.className = 'customer-row';
        if (index === 0) row.classList.add('top-customer');
        
        row.innerHTML = `
            <div class="customer-col">${customer.customer_name}</div>
            <div class="customer-col">$${parseFloat(customer.total_balance).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
            <div class="customer-col">${customer.overdue_invoices}</div>
        `;
        customerList.appendChild(row);
    });
}

// Utility Functions
function addInvoiceCheckboxListeners() {
    const checkboxes = document.querySelectorAll('.invoice-checkbox');
    const selectAllCheckbox = document.getElementById('selectAll');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedAmount);
    });

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            checkboxes.forEach(cb => {
                cb.checked = this.checked;
            });
            updateSelectedAmount();
        });
    }
}

function updateSelectedAmount() {
    const checkboxes = document.querySelectorAll('.invoice-checkbox:checked');
    const selectedAmountElement = document.getElementById('selectedAmount');
    const selectedCountElement = document.getElementById('selectedCount');
    
    let totalAmount = 0;
    checkboxes.forEach(checkbox => {
        totalAmount += parseFloat(checkbox.dataset.amount || 0);
    });

    if (selectedAmountElement) {
        selectedAmountElement.textContent = '$' + totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2});
    }

    if (selectedCountElement) {
        selectedCountElement.textContent = checkboxes.length;
    }

    // Enable/disable action buttons
    const makePaymentBtn = document.getElementById('makePaymentBtn');
    const sendReminderBtn = document.getElementById('sendReminderBtn');
    
    if (makePaymentBtn) {
        makePaymentBtn.disabled = checkboxes.length === 0;
    }
    
    if (sendReminderBtn) {
        sendReminderBtn.disabled = checkboxes.length === 0;
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Initialize data loading based on current page
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    switch (currentPage) {
        case 'index.html':
        case '':
            loadDashboardData();
            break;
        case 'accounts-payable.html':
            loadAPData();
            break;
        case 'accounts-receivable.html':
            loadARData();
            break;
    }
});

// Export for use in other files
window.FinanceAPI = FinanceAPI;
window.api = api; 