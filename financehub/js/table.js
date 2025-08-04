// Vault table data and functionality

const vaultData = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    price: "$13,643.21",
    daily: "+$213.8",
    balance: "$13,954.04",
    apy: "8.56%",
    state: "Fixed",
    startDate: "05.10.2023",
    liquidity: "high",
  },
  {
    name: "USDT",
    symbol: "USDT",
    price: "$1.00",
    daily: "+$45.1",
    balance: "$3,954.04",
    apy: "5.44%",
    state: "Fixed",
    startDate: "12.03.2023",
    liquidity: "medium",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    price: "$2,123.87",
    daily: "+$13.5",
    balance: "$3,954.04",
    apy: "4.12%",
    state: "Flexible",
    startDate: "21.01.2023",
    liquidity: "low",
  },
]

// Function to create liquidity bars
function createLiquidityBars(liquidity) {
  const levels = liquidity === "high" ? 3 : liquidity === "medium" ? 2 : 1
  let barsHtml = ""

  for (let i = 0; i < 3; i++) {
    const activeClass = i < levels ? "active" : "inactive"
    barsHtml += `<span class="liquidity-bar ${activeClass}"></span>`
  }

  return barsHtml
}

// Function to populate vault table
function populateVaultTable() {
  const tableBody = document.getElementById("vaultTableBody")
  if (!tableBody) return

  tableBody.innerHTML = ""

  vaultData.forEach((vault) => {
    const row = document.createElement("tr")

    row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="avatar">
                        <img src="/placeholder.svg?height=24&width=24" alt="${vault.name}" style="width: 24px; height: 24px; border-radius: 50%;">
                    </div>
                    <div>
                        <div class="fw-medium">${vault.name}</div>
                        <small class="text-muted">${vault.price}</small>
                    </div>
                </div>
            </td>
            <td class="text-success">${vault.daily}</td>
            <td>${vault.balance}</td>
            <td>${vault.apy}</td>
            <td>
                <span class="state-badge ${vault.state === "Fixed" ? "state-fixed" : "state-flexible"}">
                    ${vault.state}
                </span>
            </td>
            <td>${vault.startDate}</td>
            <td>
                <div class="d-flex align-items-center">
                    ${createLiquidityBars(vault.liquidity)}
                </div>
            </td>
            <td>
                <i class="bi bi-three-dots text-muted" style="cursor: pointer;"></i>
            </td>
        `

    tableBody.appendChild(row)
  })
}

// Initialize table when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  populateVaultTable()
})
