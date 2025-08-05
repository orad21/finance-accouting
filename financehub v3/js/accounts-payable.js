// Accounts Payable functionality

let selectedInvoices = [];
let apData = {
    invoices: [],
    aging: [],
    summary: {}
};

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
    loadAPData();
    setupEventListeners();
});

// Load AP data from API
async function loadAPData() {
    try {
        console.log('Loading AP data...');
        const [chartDataResponse, invoicesResponse] = await Promise.all([
            api.getChartData(),
            fetch('api/ap-invoices.php').then(r => r.json())
        ]);

        console.log('Chart data response:', chartDataResponse);
        console.log('Invoices response:', invoicesResponse);

        // Update chart data with real data
        if (chartDataResponse.success) {
            window.accountsPayableData = chartDataResponse.data.accounts_payable || [];
            console.log('Updated accountsPayableData:', window.accountsPayableData);
            // Re-initialize charts with real data
            initializeChartsWithRealData();
        }

        // Load AP invoices data
        if (invoicesResponse.success) {
            console.log('Updating AP invoices:', invoicesResponse.invoices);
            console.log('Updating AP summary:', invoicesResponse.summary);
            apData.invoices = invoicesResponse.invoices;
            apData.summary = invoicesResponse.summary;
            populateInvoiceList();
            updateSummary();
        }
    } catch (error) {
        console.error('Failed to load AP data:', error);
        showNotification('Failed to load accounts payable data', 'error');
    }
}



// Initialize charts with real data
function initializeChartsWithRealData() {
    // Update the accounts payable chart with real data
    const ctx = document.getElementById("apAgingChart");
    if (ctx && window.accountsPayableData && window.accountsPayableData.length > 0) {
        // Destroy existing chart if it exists
        const existingChart = window.Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }

        // Use the same configuration as the dashboard AP chart
        const chartConfig = {
            type: "bar",
            data: {
                labels: window.accountsPayableData.map((item) => item.period),
                datasets: [
                    {
                        label: "Amount",
                        data: window.accountsPayableData.map((item) => parseFloat(item.amount)),
                        backgroundColor: "#ff6b00",
                        borderColor: "#ff6b00",
                        borderWidth: 1,
                        borderRadius: 6,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        titleColor: "#fff",
                        bodyColor: "#fff",
                        borderColor: "#333",
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => `$${context.parsed.y.toLocaleString()}`,
                        },
                    },
                },
                scales: {
                    x: {
                        grid: {
                            color: "#333",
                            drawBorder: false,
                        },
                        ticks: {
                            color: "#6c757d",
                        },
                    },
                    y: {
                        grid: {
                            color: "#333",
                            drawBorder: false,
                        },
                        ticks: {
                            color: "#6c757d",
                            callback: (value) => "$" + value / 1000 + "K",
                        },
                    },
                },
            },
        };

        new window.Chart(ctx, chartConfig);
    }
}

// Populate invoice list
function populateInvoiceList() {
    const invoiceList = document.getElementById("invoiceList");
    if (!invoiceList) return;

    invoiceList.innerHTML = "";

    apData.invoices.forEach((invoice) => {
        const row = document.createElement("div");
        row.className = "invoice-row";
        row.dataset.invoice = invoice.invoice_number;

        const badgeClass = getDaysBadgeClass(invoice.days_overdue);

        row.innerHTML = `
            <div class="invoice-col">
                <input type="checkbox" class="invoice-checkbox" data-invoice="${invoice.invoice_number}" data-amount="${invoice.balance_amount}">
            </div>
            <div class="invoice-col invoice-number" data-label="Invoice">${invoice.invoice_number}</div>
            <div class="invoice-col invoice-balance" data-label="Balance">$${parseFloat(invoice.balance_amount).toLocaleString()}</div>
            <div class="invoice-col promise-date" data-label="Due Date">
                <i class="bi bi-calendar me-1"></i>${invoice.due_date}
            </div>
            <div class="invoice-col" data-label="Days Overdue">
                <span class="days-badge ${badgeClass}">${invoice.days_overdue > 0 ? invoice.days_overdue : 0}</span>
            </div>
            <div class="invoice-col vendor-name" data-label="Vendor">${invoice.vendor_name}</div>
        `;

        invoiceList.appendChild(row);
    });
}

// Get badge class based on days overdue
function getDaysBadgeClass(days) {
    if (days > 60) return "high";
    if (days > 30) return "medium";
    return "low";
}

// Setup event listeners
function setupEventListeners() {
    // Select all checkbox
    const selectAllCheckbox = document.getElementById("selectAll");
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener("change", (e) => {
            const checkboxes = document.querySelectorAll(".invoice-checkbox");
            checkboxes.forEach((checkbox) => {
                checkbox.checked = e.target.checked;
                handleInvoiceSelection(checkbox.dataset.invoice, e.target.checked);
            });
        });
    }

    // Individual checkboxes
    document.addEventListener("change", (e) => {
        if (e.target.classList.contains("invoice-checkbox")) {
            handleInvoiceSelection(e.target.dataset.invoice, e.target.checked);
        }
    });

    // Action buttons
    const makePaymentBtn = document.getElementById("makePaymentBtn");
    const sendReminderBtn = document.getElementById("sendReminderBtn");
    const paymentForm = document.getElementById("paymentForm");
    const paymentInput = document.getElementById("paymentInput");
    const confirmPayment = document.getElementById("confirmPayment");
    const cancelPayment = document.getElementById("cancelPayment");

    if (makePaymentBtn) {
        makePaymentBtn.addEventListener("click", () => {
            makePaymentBtn.classList.add("d-none");
            sendReminderBtn.classList.add("d-none");
            paymentForm.classList.remove("d-none");
            paymentForm.classList.add("d-flex");
            paymentInput.focus();
        });
    }

    if (sendReminderBtn) {
        sendReminderBtn.addEventListener("click", async () => {
            if (selectedInvoices.length > 0) {
                try {
                    // Here you would typically call an API to send reminders
                    showNotification(`Reminder sent for ${selectedInvoices.length} invoice(s)`, 'success');
                    clearSelections();
                } catch (error) {
                    showNotification('Failed to send reminders', 'error');
                }
            }
        });
    }

    if (confirmPayment) {
        confirmPayment.addEventListener("click", async () => {
            const amount = Number.parseFloat(paymentInput.value.replace(/[^0-9.-]+/g, ""));
            if (!isNaN(amount) && amount > 0 && selectedInvoices.length > 0) {
                try {
                    // Process payment for selected invoices
                    for (const invoiceId of selectedInvoices) {
                        await api.createAPPayment({
                            invoice_id: parseInt(invoiceId),
                            payment_amount: amount / selectedInvoices.length,
                            payment_method: 'check',
                            reference_number: 'PAY-' + Date.now()
                        });
                    }
                    
                    showNotification(`Payment of $${amount.toLocaleString()} processed for ${selectedInvoices.length} invoice(s)`, 'success');
                    resetPaymentForm();
                    clearSelections();
                    loadAPData(); // Reload data
                } catch (error) {
                    showNotification('Failed to process payment', 'error');
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

// Handle invoice selection
function handleInvoiceSelection(invoice, isSelected) {
    if (isSelected) {
        if (!selectedInvoices.includes(invoice)) {
            selectedInvoices.push(invoice);
        }
    } else {
        selectedInvoices = selectedInvoices.filter((i) => i !== invoice);
    }

    // Update row styling
    const row = document.querySelector(`[data-invoice="${invoice}"]`);
    if (row) {
        if (isSelected) {
            row.classList.add("selected");
        } else {
            row.classList.remove("selected");
        }
    }

    updateActionButtons();
    updateSummary();
}

// Update action buttons state
function updateActionButtons() {
    const makePaymentBtn = document.getElementById("makePaymentBtn");
    const sendReminderBtn = document.getElementById("sendReminderBtn");

    const hasSelection = selectedInvoices.length > 0;

    if (makePaymentBtn) makePaymentBtn.disabled = !hasSelection;
    if (sendReminderBtn) sendReminderBtn.disabled = !hasSelection;
}

// Update summary
function updateSummary() {
    const totalOutstanding = apData.summary.total_outstanding || 0;
    const selectedAmount = selectedInvoices.reduce((sum, invoiceNumber) => {
        const invoice = apData.invoices.find((i) => i.invoice_number === invoiceNumber);
        return sum + (invoice ? parseFloat(invoice.balance_amount) : 0);
    }, 0);
    const overdueCount = apData.summary.overdue_count || 0;

    document.getElementById("totalOutstanding").textContent = `$${parseFloat(totalOutstanding).toLocaleString()}`;
    document.getElementById("selectedAmount").textContent = `$${selectedAmount.toLocaleString()}`;
    document.getElementById("overdueCount").textContent = overdueCount;
    document.getElementById("selectedCount").textContent = selectedInvoices.length;
}

// Reset payment form
function resetPaymentForm() {
    const makePaymentBtn = document.getElementById("makePaymentBtn");
    const sendReminderBtn = document.getElementById("sendReminderBtn");
    const paymentForm = document.getElementById("paymentForm");
    const paymentInput = document.getElementById("paymentInput");

    if (makePaymentBtn) makePaymentBtn.classList.remove("d-none");
    if (sendReminderBtn) sendReminderBtn.classList.remove("d-none");
    if (paymentForm) {
        paymentForm.classList.add("d-none");
        paymentForm.classList.remove("d-flex");
    }
    if (paymentInput) paymentInput.value = "";
}

// Clear all selections
function clearSelections() {
    selectedInvoices = [];
    const checkboxes = document.querySelectorAll(".invoice-checkbox");
    const selectAllCheckbox = document.getElementById("selectAll");

    checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
        const row = document.querySelector(`[data-invoice="${checkbox.dataset.invoice}"]`);
        if (row) row.classList.remove("selected");
    });

    if (selectAllCheckbox) selectAllCheckbox.checked = false;

    updateActionButtons();
    updateSummary();
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
