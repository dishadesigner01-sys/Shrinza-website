document.addEventListener('DOMContentLoaded', () => {
    const session = ShrinzaStore.getSession();

    const loggedOutState = document.getElementById('orders-logged-out');
    const loggedInState = document.getElementById('orders-logged-in');
    const emptyState = document.getElementById('orders-empty-state');
    const listContainer = document.getElementById('my-orders-list');

    if (!session) {
        if (loggedOutState) loggedOutState.classList.remove('hidden');
        if (loggedInState) loggedInState.classList.add('hidden');
        return;
    }

    if (loggedOutState) loggedOutState.classList.add('hidden');
    if (loggedInState) loggedInState.classList.remove('hidden');

    document.getElementById('orders-customer-name').textContent = session.name || session.mobile;
    document.getElementById('orders-customer-id').textContent = session.customerId;

    const orders = ShrinzaStore.getOrders()
        .filter(o => o.customerId === session.customerId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (orders.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    function formatDate(iso) {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return iso || '—';
        return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function formatAmount(n) {
        return '₹' + Number(n || 0).toLocaleString('en-IN');
    }

    const statusMeta = {
        pending: { label: 'Pending', badge: 'badge-pending' },
        dispatched: { label: 'Dispatched', badge: 'badge-dispatched' },
        delivered: { label: 'Delivered', badge: 'badge-delivered' }
    };

    orders.forEach(order => {
        const status = statusMeta[order.orderStatus] || statusMeta.pending;
        const paymentBadge = order.paymentStatus === 'paid' ? 'badge-paid' : 'badge-failed';
        const paymentLabel = order.paymentStatus === 'paid' ? 'Paid' : 'Failed';

        const itemsHtml = (order.items || []).map(item => {
            const sizeLabel = item.size ? ' (' + item.size + ')' : '';
            return `<p class="order-item-line">${item.name}${sizeLabel} &times; ${item.quantity} <span>${formatAmount(item.price * item.quantity)}</span></p>`;
        }).join('');

        const trackingHtml = order.trackingId
            ? `<span class="order-card-tracking">Tracking ID: ${order.trackingId}</span>`
            : `<span class="order-card-tracking">Not dispatched yet</span>`;

        const card = document.createElement('div');
        card.className = 'order-card';
        card.innerHTML = `
            <div class="order-card-header">
                <div>
                    <h3>${order.orderId}</h3>
                    <p class="order-card-date">${formatDate(order.createdAt)}</p>
                </div>
                <div class="order-card-badges">
                    <span class="badge ${paymentBadge}">${paymentLabel}</span>
                    <span class="badge ${status.badge}">${status.label}</span>
                </div>
            </div>
            <div class="order-card-items">${itemsHtml}</div>
            <div class="order-card-footer">
                <span class="order-card-total">Total: ${formatAmount(order.amount)}</span>
                ${trackingHtml}
            </div>
        `;
        listContainer.appendChild(card);
    });
});
