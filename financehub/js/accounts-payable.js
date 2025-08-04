// Accounts Payable functionality

// Sample data
const invoiceData = [
  { invoice: "#1291", balance: 3200, promiseDate: "2024-06-01", daysOverdue: 52, vendor: "Office Supplies Co" },
  { invoice: "#1421", balance: 1100, promiseDate: "2024-06-15", daysOverdue: 43, vendor: "Tech Solutions Ltd" },
  { invoice: "#1582", balance: 2900, promiseDate: "2024-06-22", daysOverdue: 36, vendor: "Marketing Agency" },
  { invoice: "#1607", balance: 800, promiseDate: "2024-07-01", daysOverdue: 27, vendor: "Utilities Corp" },
  { invoice: "#1634", balance: 1500, promiseDate: "2024-07-15", daysOverdue: 15, vendor: "Legal Services" },
]

const agingData = [
  { period: "0-30", amount: 125000 },
  { period: "31-60", amount: 95000 },
  { period: "61-90", amount: 65000 },
  { period: "90+", amount: 45000 },
]

let selectedInvoices = []

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  initializeAPAgingChart()
  populateInvoiceList()
  setupEventListeners()
  updateSummary()
})

// Initialize AP Aging Chart
function initializeAPAgingChart() {
  const ctx = document.getElementById("apAgingChart")
  if (!ctx) return

  new window.Chart(ctx, {
    // Changed Chart to window.Chart
    type: "bar",
    data: {
      labels: agingData.map((item) => item.period),
      datasets: [
        {
          label: "Amount",
          data: agingData.map((item) => item.amount),
          backgroundColor: "#ff6b00",
          borderColor: "#ff6b00",
          borderWidth: 1,
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
  })
}

// Populate invoice list
function populateInvoiceList() {
  const invoiceList = document.getElementById("invoiceList")
  if (!invoiceList) return

  invoiceList.innerHTML = ""

  invoiceData.forEach((invoice) => {
    const row = document.createElement("div")
    row.className = "invoice-row"
    row.dataset.invoice = invoice.invoice

    const badgeClass = getDaysBadgeClass(invoice.daysOverdue)

    row.innerHTML = `
            <div class="invoice-col">
                <input type="checkbox" class="invoice-checkbox" data-invoice="${invoice.invoice}">
            </div>
            <div class="invoice-col invoice-number" data-label="Invoice">${invoice.invoice}</div>
            <div class="invoice-col invoice-balance" data-label="Balance">$${invoice.balance.toLocaleString()}</div>
            <div class="invoice-col promise-date" data-label="Promise Date">
                <i class="bi bi-calendar me-1"></i>${invoice.promiseDate}
            </div>
            <div class="invoice-col" data-label="Days Overdue">
                <span class="days-badge ${badgeClass}">${invoice.daysOverdue}</span>
            </div>
            <div class="invoice-col vendor-name" data-label="Vendor">${invoice.vendor}</div>
        `

    invoiceList.appendChild(row)
  })
}

// Get badge class based on days overdue
function getDaysBadgeClass(days) {
  if (days > 60) return "high"
  if (days > 30) return "medium"
  return "low"
}

// Setup event listeners
function setupEventListeners() {
  // Select all checkbox
  const selectAllCheckbox = document.getElementById("selectAll")
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", (e) => {
      const checkboxes = document.querySelectorAll(".invoice-checkbox")
      checkboxes.forEach((checkbox) => {
        checkbox.checked = e.target.checked
        handleInvoiceSelection(checkbox.dataset.invoice, e.target.checked)
      })
    })
  }

  // Individual checkboxes
  document.addEventListener("change", (e) => {
    if (e.target.classList.contains("invoice-checkbox")) {
      handleInvoiceSelection(e.target.dataset.invoice, e.target.checked)
    }
  })

  // Action buttons
  const makePaymentBtn = document.getElementById("makePaymentBtn")
  const sendReminderBtn = document.getElementById("sendReminderBtn")
  const paymentForm = document.getElementById("paymentForm")
  const paymentInput = document.getElementById("paymentInput")
  const confirmPayment = document.getElementById("confirmPayment")
  const cancelPayment = document.getElementById("cancelPayment")

  if (makePaymentBtn) {
    makePaymentBtn.addEventListener("click", () => {
      makePaymentBtn.classList.add("d-none")
      sendReminderBtn.classList.add("d-none")
      paymentForm.classList.remove("d-none")
      paymentForm.classList.add("d-flex")
      paymentInput.focus()
    })
  }

  if (sendReminderBtn) {
    sendReminderBtn.addEventListener("click", () => {
      if (selectedInvoices.length > 0) {
        alert(`Reminder sent for ${selectedInvoices.length} invoice(s)`)
        clearSelections()
      }
    })
  }

  if (confirmPayment) {
    confirmPayment.addEventListener("click", () => {
      const amount = Number.parseFloat(paymentInput.value.replace(/[^0-9.-]+/g, ""))
      if (!isNaN(amount) && amount > 0 && selectedInvoices.length > 0) {
        alert(`Payment of $${amount.toLocaleString()} processed for ${selectedInvoices.length} invoice(s)`)
        resetPaymentForm()
        clearSelections()
      }
    })
  }

  if (cancelPayment) {
    cancelPayment.addEventListener("click", resetPaymentForm)
  }

  if (paymentInput) {
    paymentInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        confirmPayment.click()
      } else if (e.key === "Escape") {
        resetPaymentForm()
      }
    })
  }
}

// Handle invoice selection
function handleInvoiceSelection(invoice, isSelected) {
  if (isSelected) {
    if (!selectedInvoices.includes(invoice)) {
      selectedInvoices.push(invoice)
    }
  } else {
    selectedInvoices = selectedInvoices.filter((i) => i !== invoice)
  }

  // Update row styling
  const row = document.querySelector(`[data-invoice="${invoice}"]`)
  if (row) {
    if (isSelected) {
      row.classList.add("selected")
    } else {
      row.classList.remove("selected")
    }
  }

  updateActionButtons()
  updateSummary()
}

// Update action buttons state
function updateActionButtons() {
  const makePaymentBtn = document.getElementById("makePaymentBtn")
  const sendReminderBtn = document.getElementById("sendReminderBtn")

  const hasSelection = selectedInvoices.length > 0

  if (makePaymentBtn) makePaymentBtn.disabled = !hasSelection
  if (sendReminderBtn) sendReminderBtn.disabled = !hasSelection
}

// Update summary
function updateSummary() {
  const totalOutstanding = invoiceData.reduce((sum, invoice) => sum + invoice.balance, 0)
  const selectedAmount = selectedInvoices.reduce((sum, invoiceId) => {
    const invoice = invoiceData.find((i) => i.invoice === invoiceId)
    return sum + (invoice ? invoice.balance : 0)
  }, 0)
  const overdueCount = invoiceData.filter((invoice) => invoice.daysOverdue > 60).length

  document.getElementById("totalOutstanding").textContent = `$${totalOutstanding.toLocaleString()}`
  document.getElementById("selectedAmount").textContent = `$${selectedAmount.toLocaleString()}`
  document.getElementById("overdueCount").textContent = overdueCount
  document.getElementById("selectedCount").textContent = selectedInvoices.length
}

// Reset payment form
function resetPaymentForm() {
  const makePaymentBtn = document.getElementById("makePaymentBtn")
  const sendReminderBtn = document.getElementById("sendReminderBtn")
  const paymentForm = document.getElementById("paymentForm")
  const paymentInput = document.getElementById("paymentInput")

  if (makePaymentBtn) makePaymentBtn.classList.remove("d-none")
  if (sendReminderBtn) sendReminderBtn.classList.remove("d-none")
  if (paymentForm) {
    paymentForm.classList.add("d-none")
    paymentForm.classList.remove("d-flex")
  }
  if (paymentInput) paymentInput.value = ""
}

// Clear all selections
function clearSelections() {
  selectedInvoices = []
  const checkboxes = document.querySelectorAll(".invoice-checkbox")
  const selectAllCheckbox = document.getElementById("selectAll")

  checkboxes.forEach((checkbox) => {
    checkbox.checked = false
    const row = document.querySelector(`[data-invoice="${checkbox.dataset.invoice}"]`)
    if (row) row.classList.remove("selected")
  })

  if (selectAllCheckbox) selectAllCheckbox.checked = false

  updateActionButtons()
  updateSummary()
}
