// Accounts Receivable functionality

let arData = {
    customers: [],
    aging: [],
    summary: {}
};

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
    loadARData();
    setupEventListeners();
});

// Load AR data from API
async function loadARData() {
    try {
        console.log('Loading AR data...');
        const [chartDataResponse, customersResponse] = await Promise.all([
            api.getChartData(),
            fetch('api/ar-customers.php').then(r => r.json())
        ]);

        console.log('Chart data response:', chartDataResponse);
        console.log('Customers response:', customersResponse);

        // Update chart data with real data
        if (chartDataResponse.success) {
            window.accountsReceivableData = chartDataResponse.data.accounts_receivable || [];
            console.log('Updated accountsReceivableData:', window.accountsReceivableData);
            // Re-initialize charts with real data
            initializeChartsWithRealData();
        }

        // Load at-risk customers and collections data
        if (customersResponse.success) {
            console.log('Updating at-risk customers:', customersResponse.at_risk_customers);
            console.log('Updating collections data:', customersResponse.collection_metrics);
            updateAtRiskCustomers(customersResponse.at_risk_customers);
            updateCollectionsData(customersResponse.collection_metrics);
        }
    } catch (error) {
        console.error('Failed to load AR data:', error);
        showNotification('Failed to load accounts receivable data', 'error');
    }
}



// Initialize charts with real data
function initializeChartsWithRealData() {
    // Update the accounts receivable chart with real data
    const ctx = document.getElementById("arAgingChart");
    if (ctx && window.accountsReceivableData && window.accountsReceivableData.length > 0) {
        // Destroy existing chart if it exists
        const existingChart = window.Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }

        // Use the same configuration as the dashboard AR chart
        const chartConfig = {
            type: "doughnut",
            data: {
                labels: window.accountsReceivableData.map((item) => item.period),
                datasets: [
                    {
                        data: window.accountsReceivableData.map((item) => parseFloat(item.amount)),
                        backgroundColor: ["#22c55e", "#f59e0b", "#ef4444", "#dc2626"],
                        borderWidth: 0,
                        cutout: "60%",
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: "right",
                        labels: {
                            color: "#ffffff",
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
                                            pointStyle: "circle",
                                            hidden: false,
                                            index: i,
                                        };
                                    });
                                }
                                return [];
                            },
                        },
                    },
                    tooltip: {
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        titleColor: "#fff",
                        bodyColor: "#fff",
                        borderColor: "#333",
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            label: (context) => {
                                const label = context.label || "";
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: $${value.toLocaleString()} (${percentage}%)`;
                            },
                        },
                    },
                },
            },
        };

        new window.Chart(ctx, chartConfig);
    }
}

// Update at-risk customers
function updateAtRiskCustomers(customers) {
    const customerList = document.getElementById("customerList");
    if (!customerList) return;

    customerList.innerHTML = "";

    customers.forEach((customer, index) => {
        const row = document.createElement("div");
        row.className = `customer-row ${index === 0 ? "top-customer" : ""}`;

        row.innerHTML = `
            <div class="customer-name" data-label="Customer">${customer.customer_name}</div>
            <div data-label="Balance">$${parseFloat(customer.total_balance).toLocaleString()}</div>
            <div data-label="Days Overdue">${customer.days_overdue} days</div>
        `;

        customerList.appendChild(row);
    });
}

// Update collections data
function updateCollectionsData(metrics) {
    const collectedElement = document.getElementById("collectedAmount");
    const expectedElement = document.getElementById("expectedAmount");
    const progressBar = document.getElementById("progressBar");
    const progressPercentage = document.getElementById("progressPercentage");

    if (collectedElement) {
        collectedElement.textContent = `$${parseFloat(metrics.collected_amount).toLocaleString()}`;
    }

    if (expectedElement) {
        expectedElement.textContent = `$${parseFloat(metrics.expected_amount).toLocaleString()}`;
    }

    if (progressBar) {
        progressBar.style.width = `${Math.min(metrics.progress_percentage, 100)}%`;
    }

    if (progressPercentage) {
        progressPercentage.textContent = `${metrics.progress_percentage}%`;
    }
}



// Setup event listeners
function setupEventListeners() {
    const addPaymentBtn = document.getElementById("addPaymentBtn");
    const addPaymentForm = document.getElementById("addPaymentForm");
    const paymentInput = document.getElementById("paymentInput");
    const confirmPayment = document.getElementById("confirmPayment");
    const cancelPayment = document.getElementById("cancelPayment");
    const topCustomerBtn = document.getElementById("topCustomerBtn");

    if (addPaymentBtn) {
        addPaymentBtn.addEventListener("click", () => {
            addPaymentBtn.classList.add("d-none");
            addPaymentForm.classList.remove("d-none");
            addPaymentForm.classList.add("d-flex");
            paymentInput.focus();
        });
    }

    if (topCustomerBtn) {
        topCustomerBtn.addEventListener("click", showTopCustomerDetails);
    }

    if (confirmPayment) {
        confirmPayment.addEventListener("click", async () => {
            const amount = Number.parseFloat(paymentInput.value.replace(/[^0-9.-]+/g, ""));
            if (!isNaN(amount) && amount > 0) {
                try {
                    const response = await fetch('api/ar-customers.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            amount: amount
                        })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        showNotification(`Payment of $${amount.toLocaleString()} added successfully`, 'success');
                        resetPaymentForm();
                        loadARData(); // Reload data to reflect changes
                    } else {
                        showNotification(result.error || 'Failed to add payment', 'error');
                    }
                } catch (error) {
                    console.error('Payment error:', error);
                    showNotification('Failed to add payment', 'error');
                }
            } else {
                showNotification('Please enter a valid payment amount', 'error');
            }
        });
    }

    if (cancelPayment) {
        cancelPayment.addEventListener("click", resetPaymentForm);
    }

    if (paymentInput) {
        paymentInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                confirmPayment.click();
            } else if (e.key === "Escape") {
                resetPaymentForm();
            }
        });
    }
}

// Reset payment form
function resetPaymentForm() {
    const addPaymentBtn = document.getElementById("addPaymentBtn");
    const addPaymentForm = document.getElementById("addPaymentForm");
    const paymentInput = document.getElementById("paymentInput");

    if (addPaymentBtn) addPaymentBtn.classList.remove("d-none");
    if (addPaymentForm) {
        addPaymentForm.classList.add("d-none");
        addPaymentForm.classList.remove("d-flex");
    }
    if (paymentInput) paymentInput.value = "";
}

// Show top customer details
async function showTopCustomerDetails() {
    try {
        const response = await fetch('api/top-customer.php');
        const result = await response.json();
        
        if (result.success) {
            const customer = result.customer_details;
            const invoices = result.outstanding_invoices;
            const paymentHistory = result.payment_history;
            
            // Create modal content
            const modalContent = `
                <div class="modal fade" id="topCustomerModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="bi bi-star-fill text-warning me-2"></i>
                                    Top At-Risk Customer Details
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row mb-4">
                                    <div class="col-md-6">
                                        <h6 class="fw-bold">Customer Information</h6>
                                        <p><strong>Name:</strong> ${customer.customer_name}</p>
                                        <p><strong>Contact:</strong> ${customer.contact_person || 'N/A'}</p>
                                        <p><strong>Email:</strong> ${customer.email || 'N/A'}</p>
                                        <p><strong>Phone:</strong> ${customer.phone || 'N/A'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <h6 class="fw-bold">Account Summary</h6>
                                        <p><strong>Total Outstanding:</strong> <span class="text-danger">$${parseFloat(customer.total_outstanding).toLocaleString()}</span></p>
                                        <p><strong>Days Overdue:</strong> <span class="text-warning">${customer.days_overdue} days</span></p>
                                        <p><strong>Total Invoices:</strong> ${customer.total_invoices}</p>
                                        <p><strong>Credit Limit:</strong> $${parseFloat(customer.credit_limit).toLocaleString()}</p>
                                    </div>
                                </div>
                                
                                <div class="mb-4">
                                    <h6 class="fw-bold">Outstanding Invoices</h6>
                                    <div class="table-responsive">
                                        <table class="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Invoice #</th>
                                                    <th>Due Date</th>
                                                    <th>Amount</th>
                                                    <th>Balance</th>
                                                    <th>Days Overdue</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${invoices.map(inv => `
                                                    <tr>
                                                        <td>${inv.invoice_number}</td>
                                                        <td>${new Date(inv.due_date).toLocaleDateString()}</td>
                                                        <td>$${parseFloat(inv.total_amount).toLocaleString()}</td>
                                                        <td class="text-danger">$${parseFloat(inv.balance_amount).toLocaleString()}</td>
                                                        <td class="text-warning">${inv.days_overdue} days</td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                
                                <div>
                                    <h6 class="fw-bold">Recent Payment History</h6>
                                    <div class="table-responsive">
                                        <table class="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Invoice #</th>
                                                    <th>Amount</th>
                                                    <th>Method</th>
                                                    <th>Reference</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${paymentHistory.length > 0 ? paymentHistory.map(payment => `
                                                    <tr>
                                                        <td>${new Date(payment.payment_date).toLocaleDateString()}</td>
                                                        <td>${payment.invoice_number}</td>
                                                        <td class="text-success">$${parseFloat(payment.payment_amount).toLocaleString()}</td>
                                                        <td>${payment.payment_method}</td>
                                                        <td>${payment.reference_number || 'N/A'}</td>
                                                    </tr>
                                                `).join('') : '<tr><td colspan="5" class="text-center text-muted">No recent payments found</td></tr>'}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-primary" onclick="contactCustomer('${customer.email}', '${customer.phone}')">Contact Customer</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remove existing modal if present
            const existingModal = document.getElementById('topCustomerModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Add modal to page
            document.body.insertAdjacentHTML('beforeend', modalContent);
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('topCustomerModal'));
            modal.show();
            
        } else {
            showNotification(result.message || 'No top customer data available', 'info');
        }
    } catch (error) {
        console.error('Error fetching top customer details:', error);
        showNotification('Failed to load top customer details', 'error');
    }
}

// Contact customer function
function contactCustomer(email, phone) {
    if (email && email !== 'N/A') {
        window.open(`mailto:${email}?subject=Outstanding Invoice Follow-up`, '_blank');
    } else if (phone && phone !== 'N/A') {
        showNotification(`Please call: ${phone}`, 'info');
    } else {
        showNotification('No contact information available', 'warning');
    }
}

// Show notification
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
