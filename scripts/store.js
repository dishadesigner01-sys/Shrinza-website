/*
 * Shared client-side data layer for SHRINZA (customers, sessions, orders,
 * logistics config). Wraps localStorage/sessionStorage behind a small API so
 * every page (storefront, payment, dashboard) reads/writes the same "database".
 *
 * This is a simulated backend for demo/prototype purposes — swap these
 * functions for real fetch() calls to a server later without touching the
 * pages that call them.
 */
const ShrinzaStore = (() => {
    const KEYS = {
        CUSTOMERS: 'shrinza_customers',
        SESSION: 'shrinza_session',
        ORDERS: 'shrinza_orders',
        LOGISTICS_CONFIG: 'shrinza_logistics_config',
        CUSTOMER_SEQ: 'shrinza_customer_seq',
        ORDER_SEQ: 'shrinza_order_seq',
        PENDING_ORDER: 'shrinza_pending_order',
        SEED_FLAG: 'shrinza_seeded'
    };

    function read(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function write(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function nextSeq(key, start) {
        const current = read(key, start);
        write(key, current + 1);
        return current;
    }

    // --- Customers ---
    function getCustomers() {
        return read(KEYS.CUSTOMERS, []);
    }

    function saveCustomers(list) {
        write(KEYS.CUSTOMERS, list);
    }

    function findCustomerByMobile(mobile) {
        return getCustomers().find(c => c.mobile === mobile) || null;
    }

    function upsertCustomer({ name, mobile, email, city }) {
        const customers = getCustomers();
        const existing = customers.find(c => c.mobile === mobile);
        if (existing) {
            let changed = false;
            if (name && existing.name !== name) { existing.name = name; changed = true; }
            if (email && existing.email !== email) { existing.email = email; changed = true; }
            if (city && existing.city !== city) { existing.city = city; changed = true; }
            if (changed) saveCustomers(customers);
            return existing;
        }
        const seq = nextSeq(KEYS.CUSTOMER_SEQ, 1001);
        const customer = {
            customerId: 'CUST-' + seq,
            name: name || '',
            mobile,
            email: email || '',
            city: city || '',
            createdAt: new Date().toISOString()
        };
        customers.push(customer);
        saveCustomers(customers);
        return customer;
    }

    // --- Session ---
    function getSession() {
        return read(KEYS.SESSION, null);
    }

    function setSession(customer) {
        write(KEYS.SESSION, customer);
    }

    function clearSession() {
        localStorage.removeItem(KEYS.SESSION);
    }

    // --- OTP (simulated — shown on-screen instead of sent via SMS) ---
    function generateOtp(mobile) {
        const code = String(Math.floor(1000 + Math.random() * 9000));
        sessionStorage.setItem('shrinza_otp_' + mobile, JSON.stringify({
            code,
            expiresAt: Date.now() + 2 * 60 * 1000
        }));
        return code;
    }

    function verifyOtp(mobile, code) {
        const raw = sessionStorage.getItem('shrinza_otp_' + mobile);
        if (!raw) return { ok: false, reason: 'expired' };
        const record = JSON.parse(raw);
        if (Date.now() > record.expiresAt) return { ok: false, reason: 'expired' };
        if (record.code !== String(code)) return { ok: false, reason: 'mismatch' };
        sessionStorage.removeItem('shrinza_otp_' + mobile);
        return { ok: true };
    }

    // --- Orders ---
    function getOrders() {
        return read(KEYS.ORDERS, []);
    }

    function saveOrders(list) {
        write(KEYS.ORDERS, list);
    }

    function addOrder(order) {
        const orders = getOrders();
        const seq = nextSeq(KEYS.ORDER_SEQ, 9026);
        const record = Object.assign({
            orderId: 'ORD-' + seq,
            orderStatus: 'pending',
            trackingId: null,
            createdAt: new Date().toISOString()
        }, order);
        orders.unshift(record);
        saveOrders(orders);
        return record;
    }

    function updateOrder(orderId, patch) {
        const orders = getOrders();
        const idx = orders.findIndex(o => o.orderId === orderId);
        if (idx === -1) return null;
        orders[idx] = Object.assign({}, orders[idx], patch);
        saveOrders(orders);
        return orders[idx];
    }

    // --- Pending order handoff (cart checkout -> payment page) ---
    function setPendingOrder(order) {
        write(KEYS.PENDING_ORDER, order);
    }

    function getPendingOrder() {
        return read(KEYS.PENDING_ORDER, null);
    }

    function clearPendingOrder() {
        localStorage.removeItem(KEYS.PENDING_ORDER);
    }

    // --- Logistics API config (placeholder for a real courier integration) ---
    function getLogisticsConfig() {
        return read(KEYS.LOGISTICS_CONFIG, { provider: '', baseUrl: '', apiKey: '', connected: false });
    }

    function saveLogisticsConfig(config) {
        write(KEYS.LOGISTICS_CONFIG, config);
    }

    // --- Mock logistics API calls (stand in for a real courier's API) ---
    function mockPushToLogistics(order, config) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    ok: true,
                    trackingId: 'TRK-' + Math.random().toString(36).slice(2, 9).toUpperCase(),
                    courierStatus: 'Manifested',
                    provider: (config && config.provider) || 'Demo Courier'
                });
            }, 1100);
        });
    }

    function mockFetchTrackingStatus(trackingId, config) {
        const stages = ['Manifested', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];
        return new Promise(resolve => {
            setTimeout(() => {
                const idx = trackingId ? trackingId.length % stages.length : 0;
                resolve({
                    ok: true,
                    trackingId,
                    courierStatus: stages[idx],
                    paymentStatus: 'Settled',
                    fundStatus: 'Remitted to seller account',
                    provider: (config && config.provider) || 'Demo Courier',
                    lastUpdated: new Date().toISOString()
                });
            }, 900);
        });
    }

    // --- Seed demo orders once, so the dashboard isn't empty on first load ---
    function seedDemoOrders() {
        if (read(KEYS.SEED_FLAG, false)) return;
        write(KEYS.SEED_FLAG, true);
        if (getOrders().length > 0) return;

        const seedRows = [
            { mobile: '9810000001', email: 'aisha.sharma@example.com', name: 'Aisha Sharma', city: 'Delhi', amount: 12499, item: 'Velvet Indo-Western Gown (1)', orderStatus: 'pending', daysAgo: 2 },
            { mobile: '9810000002', email: 'priya.patel@example.com', name: 'Priya Patel', city: 'Ahmedabad', amount: 15000, item: 'Fusion Drape Saree (1)', orderStatus: 'dispatched', daysAgo: 2 },
            { mobile: '9810000003', email: 'riya.singh@example.com', name: 'Riya Singh', city: 'Jaipur', amount: 45999, item: 'Emerald Heritage Lehenga (1)', orderStatus: 'delivered', daysAgo: 3 },
            { mobile: '9810000004', email: 'nisha.gupta@example.com', name: 'Nisha Gupta', city: 'Lucknow', amount: 8499, item: 'Floral Crop Set (1)', orderStatus: 'pending', daysAgo: 3 },
            { mobile: '9810000005', email: 'meera.reddy@example.com', name: 'Meera Reddy', city: 'Hyderabad', amount: 24998, item: 'Velvet Indo-Western Gown (2)', orderStatus: 'pending', daysAgo: 4 }
        ];

        seedRows.forEach(row => {
            const customer = upsertCustomer({ mobile: row.mobile, email: row.email, name: row.name, city: row.city });
            const createdAt = new Date(Date.now() - row.daysAgo * 24 * 60 * 60 * 1000).toISOString();
            addOrder({
                customerId: customer.customerId,
                customerMobile: customer.mobile,
                customerEmail: customer.email,
                items: [{ name: row.item, quantity: 1, price: row.amount }],
                amount: row.amount,
                shipping: { name: row.name, address: '—', city: '—', pincode: '—', phone: customer.mobile },
                paymentStatus: 'paid',
                paymentId: 'PAY-DEMO-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
                orderStatus: row.orderStatus,
                trackingId: row.orderStatus !== 'pending' ? 'TRK-' + Math.random().toString(36).slice(2, 9).toUpperCase() : null,
                createdAt
            });
        });
    }

    return {
        getCustomers, saveCustomers, findCustomerByMobile, upsertCustomer,
        getSession, setSession, clearSession,
        generateOtp, verifyOtp,
        getOrders, saveOrders, addOrder, updateOrder,
        setPendingOrder, getPendingOrder, clearPendingOrder,
        getLogisticsConfig, saveLogisticsConfig,
        mockPushToLogistics, mockFetchTrackingStatus,
        seedDemoOrders
    };
})();
