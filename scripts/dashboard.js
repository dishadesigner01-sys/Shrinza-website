document.addEventListener('DOMContentLoaded', () => {
    // Simulated Database of Orders
    let orders = [
        { id: 'ORD-9021', date: '2024-10-12', customer: 'Aisha Sharma', amount: '₹12,499', status: 'pending', items: 'Velvet Indo-Western Gown (1)' },
        { id: 'ORD-9022', date: '2024-10-12', customer: 'Priya Patel', amount: '₹15,000', status: 'dispatched', items: 'Fusion Drape Saree (1)' },
        { id: 'ORD-9023', date: '2024-10-11', customer: 'Riya Singh', amount: '₹45,999', status: 'delivered', items: 'Emerald Heritage Lehenga (1)' },
        { id: 'ORD-9024', date: '2024-10-11', customer: 'Nisha Gupta', amount: '₹8,499', status: 'pending', items: 'Floral Crop Set (1)' },
        { id: 'ORD-9025', date: '2024-10-10', customer: 'Meera Reddy', amount: '₹24,998', status: 'pending', items: 'Velvet Indo-Western Gown (2)' },
    ];

    const tbody = document.getElementById('orders-tbody');
    const filterSelect = document.getElementById('status-filter');
    const refreshBtn = document.getElementById('refresh-orders-btn');

    // UI Elements for stats
    const statTotal = document.getElementById('stat-total');
    const statPending = document.getElementById('stat-pending');
    const statDispatched = document.getElementById('stat-dispatched');

    // Render Orders Table
    function renderOrders(filter = 'all') {
        tbody.innerHTML = '';

        const filteredOrders = filter === 'all'
            ? orders
            : orders.filter(o => o.status === filter);

        filteredOrders.forEach(order => {
            const tr = document.createElement('tr');

            // Generate Badge HTML
            let badgeClass = 'badge-pending';
            let statusText = 'Pending';
            let actionHtml = `<button class="btn-dispatch" data-id="${order.id}">Push to Logistics</button>`;

            if (order.status === 'dispatched') {
                badgeClass = 'badge-dispatched';
                statusText = 'Dispatched';
                actionHtml = `<span style="color: #888; font-size: 0.85rem;">Tracking assigned</span>`;
            } else if (order.status === 'delivered') {
                badgeClass = 'badge-delivered';
                statusText = 'Delivered';
                actionHtml = `<span style="color: #2e7d32; font-size: 0.85rem;">Completed</span>`;
            }

            tr.innerHTML = `
                <td><strong>${order.id}</strong></td>
                <td>${order.date}</td>
                <td>
                    <div>${order.customer}</div>
                    <div style="font-size: 0.75rem; color: #888; margin-top: 4px;">${order.items}</div>
                </td>
                <td><strong>${order.amount}</strong></td>
                <td><span class="badge ${badgeClass}">${statusText}</span></td>
                <td>${actionHtml}</td>
            `;
            tbody.appendChild(tr);
        });

        updateStats();

        // Attach event listeners to newly rendered dispatch buttons
        document.querySelectorAll('.btn-dispatch').forEach(btn => {
            btn.addEventListener('click', handleDispatchEvent);
        });
    }

    // Update Dashboard Stats Tiles
    function updateStats() {
        statTotal.textContent = orders.length;
        statPending.textContent = orders.filter(o => o.status === 'pending').length;
        statDispatched.textContent = orders.filter(o => ['dispatched', 'delivered'].includes(o.status)).length;
    }

    // Handle "Push to Logistics" API Mock
    function handleDispatchEvent(e) {
        const btn = e.target;
        const orderId = btn.getAttribute('data-id');

        // Disable button to prevent double-clicks
        btn.disabled = true;
        btn.textContent = 'Pushing...';

        showToast(`Preparing API payload for ${orderId}...`, 'info');

        // Simulate API call delay to logistics provider
        setTimeout(() => {
            // Update local state
            const targetIndex = orders.findIndex(o => o.id === orderId);
            if (targetIndex > -1) {
                orders[targetIndex].status = 'dispatched';
            }

            showToast(`Success! ${orderId} dispatched to logistics via API. Tracking generated.`, 'success');

            // Re-render table with current filter
            renderOrders(filterSelect.value);

        }, 1200);
    }

    // Toast Notification System
    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = type === 'success' ? '✓' : 'ℹ';
        toast.innerHTML = `
            <div style="font-weight: bold; font-size: 1.2rem;">${icon}</div>
            <div>${message}</div>
        `;

        toastContainer.appendChild(toast);

        // Remove from DOM after animation
        setTimeout(() => {
            if (toastContainer.contains(toast)) {
                toastContainer.removeChild(toast);
            }
        }, 5000);
    }

    // Events
    filterSelect.addEventListener('change', (e) => {
        renderOrders(e.target.value);
    });

    refreshBtn.addEventListener('click', () => {
        const icon = refreshBtn.textContent;
        refreshBtn.textContent = 'Refreshing...';
        setTimeout(() => {
            renderOrders(filterSelect.value);
            refreshBtn.textContent = '⟳ Refresh';
            showToast('Orders synchronized with store.', 'success');
        }, 600);
    });

    // Initialize
    renderOrders();
});
