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

    if (addPaymentBtn) {
        addPaymentBtn.addEventListener("click", () => {
            addPaymentBtn.classList.add("d-none");
            addPaymentForm.classList.remove("d-none");
            addPaymentForm.classList.add("d-flex");
            paymentInput.focus();
        });
    }

    if (confirmPayment) {
        confirmPayment.addEventListener("click", async () => {
            const amount = Number.parseFloat(paymentInput.value.replace(/[^0-9.-]+/g, ""));
            if (!isNaN(amount) && amount > 0) {
                try {
                    // Here you would typically call an API to add a payment
                    // For now, we'll just show a success message
                    showNotification(`Payment of $${amount.toLocaleString()} added successfully`, 'success');
                    resetPaymentForm();
                    loadARData(); // Reload data
                } catch (error) {
                    showNotification('Failed to add payment', 'error');
                }
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
