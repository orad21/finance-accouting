// Chart.js configuration and initialization with real data

// Global variables to store chart data
let generalLedgerData = [];
let travelExpenseData = [];
let accountsReceivableData = [];
let accountsPayableData = [];
let assetData = [];
let bankReconciliationData = [];

// Function to fetch chart data from API
async function fetchChartData() {
    try {
        const response = await api.getChartData();
        if (response.success) {
            generalLedgerData = response.data.general_ledger || [];
            travelExpenseData = response.data.travel_expense || [];
            accountsReceivableData = response.data.accounts_receivable || [];
            accountsPayableData = response.data.accounts_payable || [];
            assetData = response.data.asset_management || [];
            bankReconciliationData = response.data.bank_reconciliation || [];
            
            // Initialize charts with real data
            initializeCharts();
        }
    } catch (error) {
        console.error('Failed to fetch chart data:', error);
        // Fallback to sample data if API fails
        initializeChartsWithSampleData();
    }
}

// Fallback sample data
function initializeChartsWithSampleData() {
    generalLedgerData = [
        { date: "Jan", revenue: 45000, expenses: 32000, profit: 13000 },
        { date: "Feb", revenue: 52000, expenses: 35000, profit: 17000 },
        { date: "Mar", revenue: 48000, expenses: 33000, profit: 15000 },
        { date: "Apr", revenue: 61000, expenses: 42000, profit: 19000 },
        { date: "May", revenue: 55000, expenses: 38000, profit: 17000 },
        { date: "Jun", revenue: 67000, expenses: 45000, profit: 22000 },
        { date: "Jul", revenue: 72000, expenses: 48000, profit: 24000 },
        { date: "Aug", revenue: 69000, expenses: 46000, profit: 23000 },
        { date: "Sep", revenue: 74000, expenses: 51000, profit: 23000 },
        { date: "Oct", revenue: 78000, expenses: 53000, profit: 25000 },
        { date: "Nov", revenue: 82000, expenses: 56000, profit: 26000 },
        { date: "Dec", revenue: 85000, expenses: 58000, profit: 27000 },
    ];

    travelExpenseData = [
        { month: "Jan", flights: 12000, hotels: 8000, meals: 3000, transport: 2000 },
        { month: "Feb", flights: 15000, hotels: 9500, meals: 3500, transport: 2200 },
        { month: "Mar", flights: 18000, hotels: 11000, meals: 4000, transport: 2800 },
        { month: "Apr", flights: 22000, hotels: 13000, meals: 4500, transport: 3200 },
        { month: "May", flights: 19000, hotels: 12000, meals: 4200, transport: 2900 },
        { month: "Jun", flights: 25000, hotels: 15000, meals: 5000, transport: 3500 },
        { month: "Jul", flights: 28000, hotels: 17000, meals: 5500, transport: 3800 },
        { month: "Aug", flights: 26000, hotels: 16000, meals: 5200, transport: 3600 },
        { month: "Sep", flights: 23000, hotels: 14000, meals: 4800, transport: 3300 },
        { month: "Oct", flights: 21000, hotels: 13500, meals: 4600, transport: 3100 },
        { month: "Nov", flights: 24000, hotels: 14500, meals: 4900, transport: 3400 },
        { month: "Dec", flights: 20000, hotels: 12500, meals: 4300, transport: 3000 },
    ];

    accountsReceivableData = [
        { period: "0-30 days", amount: 125000, count: 45 },
        { period: "31-60 days", amount: 85000, count: 32 },
        { period: "61-90 days", amount: 45000, count: 18 },
        { period: "90+ days", amount: 25000, count: 12 },
    ];

    accountsPayableData = [
        { period: "0-30 days", amount: 95000, count: 38 },
        { period: "31-60 days", amount: 72000, count: 28 },
        { period: "61-90 days", amount: 48000, count: 19 },
        { period: "90+ days", amount: 35000, count: 15 },
    ];

    assetData = [
        { category: "Equipment", value: 450000, depreciation: 45000 },
        { category: "Vehicles", value: 280000, depreciation: 35000 },
        { category: "Buildings", value: 1200000, depreciation: 60000 },
        { category: "Technology", value: 180000, depreciation: 36000 },
        { category: "Furniture", value: 95000, depreciation: 12000 },
    ];

    bankReconciliationData = [
        { month: "Jan", bookBalance: 245000, bankBalance: 243500, difference: 1500 },
        { month: "Feb", bookBalance: 267000, bankBalance: 266200, difference: 800 },
        { month: "Mar", bookBalance: 289000, bankBalance: 288100, difference: 900 },
        { month: "Apr", bookBalance: 312000, bankBalance: 311800, difference: 200 },
        { month: "May", bookBalance: 298000, bankBalance: 297500, difference: 500 },
        { month: "Jun", bookBalance: 334000, bankBalance: 333600, difference: 400 },
        { month: "Jul", bookBalance: 356000, bankBalance: 355400, difference: 600 },
        { month: "Aug", bookBalance: 378000, bankBalance: 377200, difference: 800 },
        { month: "Sep", bookBalance: 392000, bankBalance: 391500, difference: 500 },
        { month: "Oct", bookBalance: 415000, bankBalance: 414300, difference: 700 },
        { month: "Nov", bookBalance: 438000, bankBalance: 437100, difference: 900 },
        { month: "Dec", bookBalance: 462000, bankBalance: 461200, difference: 800 },
    ];

    initializeCharts();
}

// Chart configurations
const chartConfigs = {
  generalLedger: {
    type: "line",
    data: {
      labels: generalLedgerData.map((item) => item.date),
      datasets: [
        {
          label: "Revenue",
          data: generalLedgerData.map((item) => item.revenue),
          borderColor: "#22c55e",
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          borderWidth: 3,
          fill: false,
          tension: 0.4,
        },
        {
          label: "Expenses",
          data: generalLedgerData.map((item) => item.expenses),
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          borderWidth: 3,
          fill: false,
          tension: 0.4,
        },
        {
          label: "Profit",
          data: generalLedgerData.map((item) => item.profit),
          borderColor: "#ff6b00",
          backgroundColor: "rgba(255, 107, 0, 0.1)",
          borderWidth: 3,
          fill: false,
          tension: 0.4,
        },
      ],
    },
  },

  travelExpense: {
    type: "bar",
    data: {
      labels: travelExpenseData.map((item) => item.month),
      datasets: [
        {
          label: "Flights",
          data: travelExpenseData.map((item) => item.flights),
          backgroundColor: "#3b82f6",
          borderRadius: 4,
        },
        {
          label: "Hotels",
          data: travelExpenseData.map((item) => item.hotels),
          backgroundColor: "#8b5cf6",
          borderRadius: 4,
        },
        {
          label: "Meals",
          data: travelExpenseData.map((item) => item.meals),
          backgroundColor: "#f59e0b",
          borderRadius: 4,
        },
        {
          label: "Transport",
          data: travelExpenseData.map((item) => item.transport),
          backgroundColor: "#10b981",
          borderRadius: 4,
        },
      ],
    },
  },

  accountsReceivable: {
    type: "doughnut",
    data: {
      labels: accountsReceivableData.map((item) => item.period),
      datasets: [
        {
          data: accountsReceivableData.map((item) => item.amount),
          backgroundColor: ["#22c55e", "#f59e0b", "#ef4444", "#dc2626"],
          borderWidth: 0,
          cutout: "60%",
        },
      ],
    },
  },

  accountsPayable: {
    type: "bar",
    data: {
      labels: accountsPayableData.map((item) => item.period),
      datasets: [
        {
          label: "Amount",
          data: accountsPayableData.map((item) => item.amount),
          backgroundColor: "#ff6b00",
          borderColor: "#ff6b00",
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    },
  },

  assetManagement: {
    type: "bar",
    data: {
      labels: assetData.map((item) => item.category),
      datasets: [
        {
          label: "Asset Value",
          data: assetData.map((item) => item.value),
          backgroundColor: "#3b82f6",
          borderRadius: 4,
        },
        {
          label: "Depreciation",
          data: assetData.map((item) => item.depreciation),
          backgroundColor: "#ef4444",
          borderRadius: 4,
        },
      ],
    },
  },

  bankReconciliation: {
    type: "line",
    data: {
      labels: bankReconciliationData.map((item) => item.month),
      datasets: [
        {
          label: "Book Balance",
          data: bankReconciliationData.map((item) => item.bookBalance),
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderWidth: 3,
          fill: false,
          tension: 0.4,
        },
        {
          label: "Bank Balance",
          data: bankReconciliationData.map((item) => item.bankBalance),
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderWidth: 3,
          fill: false,
          tension: 0.4,
        },
      ],
    },
  },
}

// Common chart options
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: "top",
      labels: {
        color: "#ffffff",
        usePointStyle: true,
        padding: 20,
      },
    },
    tooltip: {
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      titleColor: "#fff",
      bodyColor: "#fff",
      borderColor: "#333",
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      callbacks: {
        label: (context) => {
          const label = context.dataset.label || ""
          const value = context.parsed.y || context.parsed
          return `${label}: $${value.toLocaleString()}`
        },
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
        color: "#9ca3af",
        font: {
          size: 12,
        },
      },
    },
    y: {
      grid: {
        color: "#333",
        drawBorder: false,
      },
      ticks: {
        color: "#9ca3af",
        font: {
          size: 12,
        },
        callback: (value) => "$" + (value / 1000).toFixed(0) + "K",
      },
    },
  },
  interaction: {
    intersect: false,
    mode: "index",
  },
}

// Special options for doughnut chart (AR)
const doughnutOptions = {
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
          const data = chart.data
          if (data.labels.length && data.datasets.length) {
            return data.labels.map((label, i) => {
              const value = data.datasets[0].data[i]
              return {
                text: `${label}: $${value.toLocaleString()}`,
                fillStyle: data.datasets[0].backgroundColor[i],
                strokeStyle: data.datasets[0].backgroundColor[i],
                lineWidth: 0,
                pointStyle: "circle",
                hidden: false,
                index: i,
              }
            })
          }
          return []
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
          const label = context.label || ""
          const value = context.parsed
          const total = context.dataset.data.reduce((a, b) => a + b, 0)
          const percentage = ((value / total) * 100).toFixed(1)
          return `${label}: $${value.toLocaleString()} (${percentage}%)`
        },
      },
    },
  },
}

// Special options for AP bar chart (matching AP page design)
const apBarOptions = {
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
}

// Function to initialize charts with current data
function initializeCharts() {
  const chartElements = [
    { id: "generalLedgerChart", config: "generalLedger", options: commonOptions },
    { id: "travelExpenseChart", config: "travelExpense", options: commonOptions },
    { id: "accountsReceivableChart", config: "accountsReceivable", options: doughnutOptions },
    { id: "accountsPayableChart", config: "accountsPayable", options: apBarOptions },
    { id: "assetManagementChart", config: "assetManagement", options: commonOptions },
    { id: "bankReconciliationChart", config: "bankReconciliation", options: commonOptions },
  ]

  chartElements.forEach(({ id, config, options }) => {
    const ctx = document.getElementById(id)
    if (ctx) {
      // Destroy existing chart if it exists
      const existingChart = window.Chart.getChart(ctx)
      if (existingChart) {
        existingChart.destroy()
      }
      
      new window.Chart(ctx, {
        ...chartConfigs[config],
        options: options,
      })
    }
  })
}

// Initialize charts when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Fetch real data from API
  fetchChartData()
})

// Function to update chart data (for future use)
function updateChartData(chartId, newData) {
  const chart = window.Chart.getChart(chartId) // Changed Chart to window.Chart
  if (chart) {
    chart.data = newData
    chart.update("active")
  }
}

// Function to animate chart on load
function animateChart(chartId) {
  const chart = window.Chart.getChart(chartId) // Changed Chart to window.Chart
  if (chart) {
    chart.update("active")
  }
}

// Export functions for external use
window.chartUtils = {
  updateChartData,
  animateChart,
  chartConfigs,
  generalLedgerData,
  travelExpenseData,
  accountsReceivableData,
  accountsPayableData,
  assetData,
  bankReconciliationData,
}
