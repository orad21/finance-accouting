// Accounts Receivable functionality

// Sample data
const atRiskCustomers = [
  { customer: "ABC Corp", balance: "$45,000", mostValue: "$125,000" },
  { customer: "XYZ Ltd", balance: "$32,000", mostValue: "$98,000" },
  { customer: "Tech Solutions", balance: "$28,000", mostValue: "$87,000" },
  { customer: "Global Industries", balance: "$22,000", mostValue: "$76,000" },
  { customer: "Metro Services", balance: "$18,000", mostValue: "$65,000" },
]

const agingData = [
  { period: "0-30", amount: 150000 },
  { period: "31-60", amount: 85000 },
  { period: "61-90", amount: 45000 },
  { period: "90+", amount: 25000 },
]

let collected = 400000
const expected = 500000

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  initializeARAgingChart()
  populateCustomerList()
  initializeCollections()
  setupEventListeners()
})

// Initialize AR Aging Chart
function initializeARAgingChart() {
  const ctx = document.getElementById("arAgingChart")
  if (!ctx) return

  new window.Chart(ctx, {
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

// Populate customer list
function populateCustomerList() {
  const customerList = document.getElementById("customerList")
  if (!customerList) return

  customerList.innerHTML = ""

  atRiskCustomers.forEach((customer, index) => {
    const row = document.createElement("div")
    row.className = `customer-row ${index === 0 ? "top-customer" : ""}`

    row.innerHTML = `
            <div class="customer-name" data-label="Customer">${customer.customer}</div>
            <div data-label="Balance">${customer.balance}</div>
            <div data-label="Most Value">${customer.mostValue}</div>
        `

    customerList.appendChild(row)
  })
}

// Initialize collections
function initializeCollections() {
  updateCollectionDisplay()
}

// Update collection display
function updateCollectionDisplay() {
  const collectedElement = document.getElementById("collectedAmount")
  const expectedElement = document.getElementById("expectedAmount")
  const progressBar = document.getElementById("progressBar")
  const progressPercentage = document.getElementById("progressPercentage")

  if (collectedElement) {
    collectedElement.textContent = `$${collected.toLocaleString()}`
  }

  if (expectedElement) {
    expectedElement.textContent = `$${expected.toLocaleString()}`
  }

  const percentage = Math.round((collected / expected) * 100)

  if (progressBar) {
    progressBar.style.width = `${Math.min(percentage, 100)}%`
  }

  if (progressPercentage) {
    progressPercentage.textContent = `${percentage}%`
  }
}

// Setup event listeners
function setupEventListeners() {
  const addPaymentBtn = document.getElementById("addPaymentBtn")
  const addPaymentForm = document.getElementById("addPaymentForm")
  const paymentInput = document.getElementById("paymentInput")
  const confirmPayment = document.getElementById("confirmPayment")
  const cancelPayment = document.getElementById("cancelPayment")

  if (addPaymentBtn) {
    addPaymentBtn.addEventListener("click", () => {
      addPaymentBtn.classList.add("d-none")
      addPaymentForm.classList.remove("d-none")
      addPaymentForm.classList.add("d-flex")
      paymentInput.focus()
    })
  }

  if (confirmPayment) {
    confirmPayment.addEventListener("click", () => {
      const amount = Number.parseFloat(paymentInput.value.replace(/[^0-9.-]+/g, ""))
      if (!isNaN(amount) && amount > 0) {
        collected += amount
        updateCollectionDisplay()
        resetPaymentForm()
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

// Reset payment form
function resetPaymentForm() {
  const addPaymentBtn = document.getElementById("addPaymentBtn")
  const addPaymentForm = document.getElementById("addPaymentForm")
  const paymentInput = document.getElementById("paymentInput")

  if (addPaymentBtn) addPaymentBtn.classList.remove("d-none")
  if (addPaymentForm) {
    addPaymentForm.classList.add("d-none")
    addPaymentForm.classList.remove("d-flex")
  }
  if (paymentInput) paymentInput.value = ""
}
