// Main JavaScript for FinanceHub Dashboard

// Dashboard-specific entrance animation
function initDashboardAnimations() {
    // Check if we're on the dashboard page
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        // Add special dashboard entrance animation
        const dashboardElements = document.querySelectorAll('.metrics-card, .chart-card');
        
        // Reset animations
        dashboardElements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px) scale(0.95)';
            element.style.animationDelay = `${index * 0.15}s`;
        });
        
        // Trigger entrance animation after a short delay
        setTimeout(() => {
            dashboardElements.forEach((element) => {
                element.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0) scale(1)';
            });
        }, 300);
        
        // Add special header animation
        const header = document.querySelector('h1');
        if (header) {
            header.style.opacity = '0';
            header.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                header.style.transition = 'all 0.6s ease-out';
                header.style.opacity = '1';
                header.style.transform = 'translateX(0)';
            }, 500);
        }
        
        // Add metrics animation
        const metrics = document.querySelectorAll('.metrics-card h3');
        metrics.forEach((metric, index) => {
            metric.style.opacity = '0';
            metric.style.transform = 'scale(0.8)';
            setTimeout(() => {
                metric.style.transition = 'all 0.5s ease-out';
                metric.style.opacity = '1';
                metric.style.transform = 'scale(1)';
            }, 800 + (index * 200));
        });
    }
}

// Initialize dashboard animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initDashboardAnimations();
});

// Main JavaScript functionality

document.addEventListener("DOMContentLoaded", () => {
  // Handle sidebar toggle for mobile
  const sidebarToggle = document.getElementById("sidebarToggle")
  const sidebar = document.querySelector(".sidebar")

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("show")
    })
  }

  // Handle time period button clicks
  const timePeriodButtons = document.querySelectorAll(".time-btn")
  timePeriodButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remove active class from siblings
      const siblings = this.parentElement.querySelectorAll(".time-btn")
      siblings.forEach((sibling) => sibling.classList.remove("active"))

      // Add active class to clicked button
      this.classList.add("active")

      // Here you could add logic to update charts based on selected period
      console.log("Time period selected:", this.textContent)
    })
  })

  // Handle search functionality
  const searchInput = document.querySelector(".search-input")
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase()
      // Add search logic here
      console.log("Searching for:", searchTerm)
    })
  }

  // Handle navigation clicks with routing
  const navButtons = document.querySelectorAll(".nav-btn")
  navButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault()

      // Remove active class from all nav buttons
      navButtons.forEach((navBtn) => navBtn.classList.remove("active"))

      // Add active class to clicked button
      this.classList.add("active")

      // Get the navigation text to determine route
      const navText = this.textContent.trim()

      // Handle routing based on navigation item
      switch (navText) {
        case "Dashboard":
          window.location.href = "index.html"
          break
        case "Accounts Receivable":
          window.location.href = "accounts-receivable.html"
          break
        case "Accounts Payable":
          window.location.href = "accounts-payable.html"
          break
        case "General Ledger":
          // Add general ledger page when created
          console.log("General Ledger page - Coming soon")
          break
        case "Travel Management":
          // Add travel management page when created
          console.log("Travel Management page - Coming soon")
          break
        case "Asset Accounting":
          // Add asset accounting page when created
          console.log("Asset Accounting page - Coming soon")
          break
        case "Bank Accounting":
          // Add bank accounting page when created
          console.log("Bank Accounting page - Coming soon")
          break
        default:
          console.log("Navigation clicked:", navText)
      }
    })
  })

  // Simulate real-time data updates
  setInterval(() => {
    updateMetricsCards()
  }, 30000) // Update every 30 seconds

  // Set active navigation based on current page
  setActiveNavigation()
})

// Function to update metrics cards with new data
function updateMetricsCards() {
  const cards = document.querySelectorAll(".metrics-card h3")
  cards.forEach((card) => {
    // Simulate small random changes
    const currentValue = Number.parseFloat(card.textContent.replace(/[$,]/g, ""))
    if (!isNaN(currentValue)) {
      const change = (Math.random() - 0.5) * 1000
      const newValue = currentValue + change
      card.textContent = "$" + Math.round(newValue).toLocaleString()
    }
  })
}

// Function to handle responsive behavior
function handleResize() {
  const sidebar = document.querySelector(".sidebar")
  if (window.innerWidth > 991.98) {
    sidebar.classList.remove("show")
  }
}

// Function to set active navigation based on current page
function setActiveNavigation() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html"
  const navButtons = document.querySelectorAll(".nav-btn")

  navButtons.forEach((button) => {
    button.classList.remove("active")
    const navText = button.textContent.trim()

    // Set active based on current page
    if (
      (currentPage === "index.html" && navText === "Dashboard") ||
      (currentPage === "accounts-receivable.html" && navText === "Accounts Receivable") ||
      (currentPage === "accounts-payable.html" && navText === "Accounts Payable")
    ) {
      button.classList.add("active")
    }
  })
}
