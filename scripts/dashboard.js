document.addEventListener('DOMContentLoaded', () => {
    ShrinzaStore.seedDemoOrders();

    // --- Panel Navigation ---
    const navItems = document.querySelectorAll('.nav-item[data-panel]');
    const panels = {
        orders: document.getElementById('panel-orders'),
        customers: document.getElementById('panel-customers'),
        settings: document.getElementById('panel-settings')
    };

    function showPanel(name) {
        Object.keys(panels).forEach(key => {
            if (!panels[key]) return;
            panels[key].classList.toggle('hidden', key !== name);
        });
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.panel === name);
        });
        if (name === 'customers') renderCustomers();
        if (name === 'settings') renderSettingsPanel();
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            showPanel(item.dataset.panel);
        });
    });

    // --- Helpers ---
    function formatDate(iso) {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return iso || '—';
        return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function formatAmount(n) {
        return '₹' + Number(n || 0).toLocaleString('en-IN');
    }

    // --- Toast Notification System ---
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

        setTimeout(() => {
            if (toastContainer.contains(toast)) {
                toastContainer.removeChild(toast);
            }
        }, 5000);
    }

    // --- Orders Panel ---
    const tbody = document.getElementById('orders-tbody');
    const filterSelect = document.getElementById('status-filter');
    const refreshBtn = document.getElementById('refresh-orders-btn');

    const statTotal = document.getElementById('stat-total');
    const statPending = document.getElementById('stat-pending');
    const statDispatched = document.getElementById('stat-dispatched');
    const statCollected = document.getElementById('stat-collected');

    function renderOrders(filter = 'all') {
        const orders = ShrinzaStore.getOrders();
        tbody.innerHTML = '';

        const filteredOrders = filter === 'all'
            ? orders
            : orders.filter(o => o.orderStatus === filter);

        if (filteredOrders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#888;">No orders found.</td></tr>';
        }

        filteredOrders.forEach(order => {
            const tr = document.createElement('tr');

            let badgeClass = 'badge-pending';
            let statusText = 'Pending';
            let actionHtml = `<button class="btn-dispatch" data-id="${order.orderId}">Push to Logistics</button>`;

            if (order.orderStatus === 'dispatched') {
                badgeClass = 'badge-dispatched';
                statusText = 'Dispatched';
                actionHtml = `<button class="btn-track" data-id="${order.orderId}">Track</button>`;
            } else if (order.orderStatus === 'delivered') {
                badgeClass = 'badge-delivered';
                statusText = 'Delivered';
                actionHtml = `<button class="btn-track" data-id="${order.orderId}">Track</button>`;
            }

            const paymentBadgeClass = order.paymentStatus === 'paid' ? 'badge-paid' : 'badge-failed';
            const paymentText = order.paymentStatus === 'paid' ? 'Paid' : 'Failed';

            const itemsSummary = (order.items || []).map(i => `${i.name} (${i.quantity})`).join(', ');
            const customerLine = (order.shipping && order.shipping.name) ? order.shipping.name : (order.customerMobile || '—');

            tr.innerHTML = `
                <td><strong>${order.orderId}</strong></td>
                <td>${formatDate(order.createdAt)}</td>
                <td>
                    <div>${customerLine}</div>
                    <div style="font-size: 0.75rem; color: #888; margin-top: 4px;">${order.customerMobile || ''} &middot; ${order.customerId || ''}</div>
                    <div style="font-size: 0.75rem; color: #888;">${itemsSummary}</div>
                </td>
                <td><strong>${formatAmount(order.amount)}</strong></td>
                <td><span class="badge ${paymentBadgeClass}">${paymentText}</span></td>
                <td><span class="badge ${badgeClass}">${statusText}</span></td>
                <td>${actionHtml}</td>
            `;
            tbody.appendChild(tr);
        });

        updateStats(orders);

        document.querySelectorAll('.btn-dispatch').forEach(btn => {
            btn.addEventListener('click', handleDispatchEvent);
        });
        document.querySelectorAll('.btn-track').forEach(btn => {
            btn.addEventListener('click', handleTrackEvent);
        });
    }

    function updateStats(orders) {
        statTotal.textContent = orders.length;
        statPending.textContent = orders.filter(o => o.orderStatus === 'pending').length;
        statDispatched.textContent = orders.filter(o => ['dispatched', 'delivered'].includes(o.orderStatus)).length;
        const collected = orders
            .filter(o => o.paymentStatus === 'paid')
            .reduce((sum, o) => sum + Number(o.amount || 0), 0);
        if (statCollected) statCollected.textContent = formatAmount(collected);
    }

    // Push an order to logistics — uses the configured API (mocked) if connected,
    // otherwise falls back to a simple local simulated dispatch.
    function handleDispatchEvent(e) {
        const btn = e.target;
        const orderId = btn.getAttribute('data-id');
        const config = ShrinzaStore.getLogisticsConfig();

        btn.disabled = true;
        btn.textContent = 'Pushing...';

        if (config && config.connected) {
            showToast(`Sending order ${orderId} to ${config.provider || 'logistics API'}...`, 'info');
            const order = ShrinzaStore.getOrders().find(o => o.orderId === orderId);
            ShrinzaStore.mockPushToLogistics(order, config).then(result => {
                ShrinzaStore.updateOrder(orderId, { orderStatus: 'dispatched', trackingId: result.trackingId });
                showToast(`Dispatched via ${result.provider}. Tracking ID: ${result.trackingId}`, 'success');
                renderOrders(filterSelect.value);
            });
        } else {
            showToast(`Preparing shipment for ${orderId}...`, 'info');
            setTimeout(() => {
                ShrinzaStore.updateOrder(orderId, { orderStatus: 'dispatched' });
                showToast(`${orderId} marked as dispatched.`, 'success');
                renderOrders(filterSelect.value);
            }, 1200);
        }
    }

    // --- Order Tracking Modal (order status / payment status / fund flow) ---
    const trackingModal = document.getElementById('tracking-modal');
    const trackingModalClose = document.getElementById('tracking-modal-close');
    const trackingModalBody = document.getElementById('tracking-modal-body');
    const dashboardModalOverlay = document.getElementById('modal-overlay');

    function openTrackingModal() {
        if (trackingModal) trackingModal.classList.add('open');
        if (dashboardModalOverlay) dashboardModalOverlay.classList.add('open');
    }

    function closeTrackingModal() {
        if (trackingModal) trackingModal.classList.remove('open');
        if (dashboardModalOverlay) dashboardModalOverlay.classList.remove('open');
    }

    if (trackingModalClose) trackingModalClose.addEventListener('click', closeTrackingModal);
    if (dashboardModalOverlay) dashboardModalOverlay.addEventListener('click', closeTrackingModal);

    function handleTrackEvent(e) {
        const orderId = e.target.getAttribute('data-id');
        const order = ShrinzaStore.getOrders().find(o => o.orderId === orderId);
        if (!order) return;

        trackingModalBody.innerHTML = '<p>Fetching latest status...</p>';
        openTrackingModal();

        const config = ShrinzaStore.getLogisticsConfig();
        ShrinzaStore.mockFetchTrackingStatus(order.trackingId, config).then(result => {
            trackingModalBody.innerHTML = `
                <p><strong>Order:</strong> ${order.orderId}</p>
                <p><strong>Tracking ID:</strong> ${result.trackingId || '—'}</p>
                <p><strong>Courier Status:</strong> ${result.courierStatus}</p>
                <p><strong>Payment Status:</strong> ${result.paymentStatus}</p>
                <p><strong>Fund Flow:</strong> ${result.fundStatus}</p>
                <p style="color: #999; font-size: 0.8rem; margin-top: 1rem;">Via ${result.provider} &middot; Last updated ${new Date(result.lastUpdated).toLocaleString('en-IN')}</p>
            `;
        });
    }

    filterSelect.addEventListener('change', (e) => {
        renderOrders(e.target.value);
    });

    refreshBtn.addEventListener('click', () => {
        refreshBtn.textContent = 'Refreshing...';
        setTimeout(() => {
            renderOrders(filterSelect.value);
            refreshBtn.textContent = '⟳ Refresh';
            showToast('Orders synchronized with store.', 'success');
        }, 600);
    });

    // --- Customers Panel ---
    function renderCustomers() {
        const customersTbody = document.getElementById('customers-tbody');
        if (!customersTbody) return;
        const customers = ShrinzaStore.getCustomers();
        const orders = ShrinzaStore.getOrders();
        customersTbody.innerHTML = '';

        if (customers.length === 0) {
            customersTbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#888;">No customers yet.</td></tr>';
            return;
        }

        customers.forEach(customer => {
            const orderCount = orders.filter(o => o.customerId === customer.customerId).length;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${customer.customerId}</strong></td>
                <td>${customer.name || '—'}</td>
                <td>${customer.mobile}</td>
                <td>${customer.email || '—'}</td>
                <td>${customer.city || '—'}</td>
                <td>${orderCount}</td>
                <td>${formatDate(customer.createdAt)}</td>
            `;
            customersTbody.appendChild(tr);
        });
    }

    // --- Settings Panel: Logistics API Connection (placeholder integration) ---
    const logisticsForm = document.getElementById('logistics-settings-form');
    const logisticsProviderInput = document.getElementById('logistics-provider');
    const logisticsBaseUrlInput = document.getElementById('logistics-base-url');
    const logisticsApiKeyInput = document.getElementById('logistics-api-key');
    const logisticsTestBtn = document.getElementById('logistics-test-btn');
    const logisticsStatusBadge = document.getElementById('logistics-status-badge');

    function updateLogisticsStatusBadge(connected) {
        if (!logisticsStatusBadge) return;
        if (connected) {
            logisticsStatusBadge.textContent = 'Connected';
            logisticsStatusBadge.className = 'badge badge-delivered';
        } else {
            logisticsStatusBadge.textContent = 'Not Connected';
            logisticsStatusBadge.className = 'badge badge-pending';
        }
    }

    function renderSettingsPanel() {
        const config = ShrinzaStore.getLogisticsConfig();
        if (logisticsProviderInput) logisticsProviderInput.value = config.provider || '';
        if (logisticsBaseUrlInput) logisticsBaseUrlInput.value = config.baseUrl || '';
        if (logisticsApiKeyInput) logisticsApiKeyInput.value = config.apiKey || '';
        updateLogisticsStatusBadge(config.connected);
    }

    if (logisticsTestBtn) {
        logisticsTestBtn.addEventListener('click', () => {
            const provider = logisticsProviderInput.value.trim();
            const baseUrl = logisticsBaseUrlInput.value.trim();
            const apiKey = logisticsApiKeyInput.value.trim();

            if (!provider || !baseUrl || !apiKey) {
                showToast('Enter provider, base URL, and API key to test the connection.', 'info');
                return;
            }

            logisticsTestBtn.disabled = true;
            logisticsTestBtn.textContent = 'Testing...';

            setTimeout(() => {
                ShrinzaStore.saveLogisticsConfig({ provider, baseUrl, apiKey, connected: true });
                updateLogisticsStatusBadge(true);
                logisticsTestBtn.disabled = false;
                logisticsTestBtn.textContent = 'Test Connection';
                showToast(`Connected to ${provider} (simulated). Real requests will use this endpoint once implemented.`, 'success');
            }, 1000);
        });
    }

    if (logisticsForm) {
        logisticsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const existing = ShrinzaStore.getLogisticsConfig();
            const provider = logisticsProviderInput.value.trim();
            const config = {
                provider,
                baseUrl: logisticsBaseUrlInput.value.trim(),
                apiKey: logisticsApiKeyInput.value.trim(),
                connected: Boolean(existing.connected && existing.provider === provider)
            };
            ShrinzaStore.saveLogisticsConfig(config);
            updateLogisticsStatusBadge(config.connected);
            showToast('Logistics settings saved.', 'success');
        });
    }

    // Initialize
    renderOrders();
});
