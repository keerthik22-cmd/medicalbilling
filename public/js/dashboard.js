// Dashboard specific code

async function loadDashboardStats() {
    try {
        // Get total items
        const itemsResponse = await fetch('/api/stock/items', {
            headers: getAuthHeaders()
        });
        const itemsData = await itemsResponse.json();

        if (itemsData.success) {
            document.getElementById('totalItems').textContent = itemsData.items.length;

            // Count low stock items (quantity < 10)
            const lowStockCount = itemsData.items.filter(item => item.quantity < 10).length;
            document.getElementById('lowStock').textContent = lowStockCount;
        }

        // Get today's sales
        const salesResponse = await fetch('/api/reports/sales?filter=daily', {
            headers: getAuthHeaders()
        });
        const salesData = await salesResponse.json();

        if (salesData.success) {
            document.getElementById('todaySales').textContent = salesData.summary.totalSales;
            document.getElementById('revenue').textContent = formatCurrency(salesData.summary.totalRevenue);
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load stats on page load
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
});
