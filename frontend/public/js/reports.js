// Reports page JavaScript

let currentFilter = '';

// Load report
async function loadReport(filter = '') {
  currentFilter = filter;

  try {
    const url = filter ? `/api/reports/sales?filter=${filter}` : '/api/reports/sales';
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (data.success) {
      displaySummary(data.summary);
      displaySales(data.sales);
    }
  } catch (error) {
    console.error('Load report error:', error);
    alert('Error loading report');
  }
}

// Display summary
function displaySummary(summary) {
  document.getElementById('totalSales').textContent = summary.totalSales;
  document.getElementById('totalRevenue').textContent = formatCurrency(summary.totalRevenue);

  const filterText = summary.filter ? summary.filter.toUpperCase() : 'ALL TIME';
  document.getElementById('currentFilter').textContent = filterText;
}

// Display sales
function displaySales(sales) {
  const tbody = document.getElementById('salesTableBody');

  if (sales.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--gray);">
                    No sales found for the selected period.
                </td>
            </tr>
        `;
    return;
  }

  tbody.innerHTML = sales.map(sale => {
    // Format discount display
    const discountDisplay = sale.discountPercent && sale.discountPercent > 0
      ? `<span class="badge" style="background: #e74c3c; color: white;">${sale.discountPercent}% (-${formatCurrency(sale.discountAmount || 0)})</span>`
      : `<span class="badge" style="background: #95a5a6; color: white;">No Discount</span>`;

    return `
            <tr>
                <td>${formatDate(sale.date)}</td>
                <td>${sale.invoiceNo}</td>
                <td>${sale.items.length} item(s)</td>
                <td>${discountDisplay}</td>
                <td>${formatCurrency(sale.totalAmount)}</td>
                <td>
                    <span class="badge badge-success">Paid</span>
                </td>
                <td>
                    <button onclick="downloadInvoice('${sale.invoiceNo}')" class="btn btn-primary" style="padding: 0.5rem 1rem;">
                        Download Invoice
                    </button>
                </td>
            </tr>
        `;
  }).join('');
}

// Download invoice - includes token for authentication
function downloadInvoice(invoiceNo) {
  const token = localStorage.getItem('token');
  window.open(`/api/reports/invoice/${invoiceNo}?token=${token}`, '_blank');
}

// Download report - includes token for authentication
function downloadReport() {
  const token = localStorage.getItem('token');
  const url = currentFilter
    ? `/api/reports/sales-report/download?filter=${currentFilter}&token=${token}`
    : `/api/reports/sales-report/download?token=${token}`;

  window.open(url, '_blank');
}

// Load all time report on page load
document.addEventListener('DOMContentLoaded', () => {
  loadReport('');
});
