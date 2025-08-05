# FinanceHub v2 - Chart Data Integration

## Overview

This project is a comprehensive financial management system with real-time chart data integration. The charts in the dashboard, accounts payable, and accounts receivable pages are now connected to live database data.

## Features

### Dashboard Charts
- **General Ledger Overview**: Line chart showing revenue, expenses, and profit over time
- **Travel Expense Analysis**: Bar chart displaying categorized travel expenses
- **Accounts Receivable**: Doughnut chart showing aging buckets
- **Accounts Payable**: Bar chart displaying aging buckets
- **Asset Management**: Bar chart showing asset values and depreciation
- **Bank Reconciliation**: Line chart comparing book vs bank balances

### Real-time Data Integration
- All charts fetch data from the database via API endpoints
- Automatic data refresh when pages load
- Fallback to sample data if API fails
- Responsive chart updates

## API Endpoints

### Chart Data (`api/chart-data.php`)
Returns comprehensive chart data for all dashboard charts:
- General ledger data (monthly revenue, expenses, profit)
- Travel expense data (categorized by flights, hotels, meals, transport)
- Accounts receivable aging data
- Accounts payable aging data
- Asset management data
- Bank reconciliation data

### Dashboard Data (`api/dashboard.php`)
Returns dashboard metrics and summary data.

### Accounts Payable (`api/ap-aging.php`)
Returns accounts payable aging analysis.

### Accounts Receivable (`api/ar-aging.php`)
Returns accounts receivable aging analysis.

## Database Schema

The system uses a MySQL database with the following key tables:
- `ap_invoices` - Accounts payable invoices
- `ar_invoices` - Accounts receivable invoices
- `ap_payments` - AP payments
- `ar_payments` - AR payments
- `vendors` - Vendor information
- `customers` - Customer information

## Installation

1. **Database Setup**:
   ```sql
   -- Import the database schema
   mysql -u username -p < database/schema.sql
   ```

2. **Web Server**:
   - Place files in your web server directory (e.g., XAMPP htdocs)
   - Ensure PHP and MySQL are configured

3. **Configuration**:
   - Update `api/config.php` with your database credentials

## Usage

### Testing the API
Visit `test-api.html` to test all API endpoints and verify data connectivity.

### Main Application
- **Dashboard**: `index.html` - Overview with all charts
- **Accounts Payable**: `accounts-payable.html` - AP management with aging chart
- **Accounts Receivable**: `accounts-receivable.html` - AR management with aging chart

## Chart Data Sources

### General Ledger Chart
- **Revenue**: Sum of AR invoices by month
- **Expenses**: Sum of AP invoices by month
- **Profit**: Revenue - Expenses

### Travel Expense Chart
- Categorizes AP invoices by description keywords:
  - Flights: 'flight', 'airline'
  - Hotels: 'hotel', 'lodging'
  - Meals: 'meal', 'food', 'dining'
  - Transport: 'transport', 'taxi', 'uber', 'lyft'

### Aging Charts
- **AR Aging**: Groups AR invoices by days overdue (0-30, 31-60, 61-90, 90+)
- **AP Aging**: Groups AP invoices by days overdue (0-30, 31-60, 61-90, 90+)

### Asset Management
- Categorizes AP invoices by asset type keywords:
  - Equipment: 'equipment', 'machine'
  - Technology: 'computer', 'software', 'tech'
  - Furniture: 'furniture', 'chair', 'desk'

### Bank Reconciliation
- Compares AR payments (inflow) vs AP payments (outflow) by month

## Technical Implementation

### Frontend (JavaScript)
- **charts.js**: Main chart configuration and initialization
- **api.js**: API communication layer
- **accounts-payable.js**: AP-specific functionality
- **accounts-receivable.js**: AR-specific functionality

### Backend (PHP)
- **chart-data.php**: Main chart data endpoint
- **dashboard.php**: Dashboard metrics endpoint
- **ap-aging.php**: AP aging analysis
- **ar-aging.php**: AR aging analysis

### Chart Library
- Uses Chart.js for all chart rendering
- Responsive design with dark theme
- Interactive tooltips and legends

## Data Flow

1. **Page Load**: JavaScript fetches data from API endpoints
2. **Data Processing**: Raw database data is formatted for charts
3. **Chart Rendering**: Chart.js creates visualizations
4. **User Interaction**: Charts respond to user interactions
5. **Data Updates**: Charts refresh when new data is available

## Error Handling

- API failures fall back to sample data
- Console logging for debugging
- User notifications for errors
- Graceful degradation of functionality

## Performance Considerations

- Database queries are optimized with proper indexing
- Chart data is cached during page session
- Lazy loading of chart components
- Efficient data aggregation in SQL queries

## Future Enhancements

- Real-time data updates via WebSocket
- Export chart data to PDF/Excel
- Custom date range filtering
- Drill-down capabilities for detailed analysis
- Mobile-responsive chart interactions

## Support

For issues or questions:
1. Check the browser console for JavaScript errors
2. Verify database connectivity
3. Test API endpoints using `test-api.html`
4. Review server logs for PHP errors 