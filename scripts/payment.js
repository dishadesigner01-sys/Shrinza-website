document.addEventListener('DOMContentLoaded', () => {
    const pendingOrder = ShrinzaStore.getPendingOrder();

    const emptyState = document.getElementById('payment-empty-state');
    const flow = document.getElementById('payment-flow');
    const successView = document.getElementById('payment-success');

    if (!pendingOrder || !pendingOrder.items || pendingOrder.items.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        if (flow) flow.classList.add('hidden');
        return;
    }

    const itemsContainer = document.getElementById('payment-items');
    const subtotalEl = document.getElementById('payment-subtotal');
    const totalEl = document.getElementById('payment-total');
    const btnAmountEl = document.getElementById('payment-btn-amount');
    const shippingNameEl = document.getElementById('payment-shipping-name');
    const shippingAddressEl = document.getElementById('payment-shipping-address');
    const shippingPhoneEl = document.getElementById('payment-shipping-phone');

    pendingOrder.items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'payment-item-row';
        const sizeLabel = item.size ? ' (' + item.size + ')' : '';
        row.innerHTML = `
            <span class="payment-item-name">${item.name}${sizeLabel} &times; ${item.quantity}</span>
            <span class="payment-item-price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
        `;
        itemsContainer.appendChild(row);
    });

    const amount = pendingOrder.amount;
    subtotalEl.textContent = '₹' + amount.toLocaleString('en-IN');
    totalEl.textContent = '₹' + amount.toLocaleString('en-IN');
    btnAmountEl.textContent = '₹' + amount.toLocaleString('en-IN');

    if (pendingOrder.shipping) {
        shippingNameEl.textContent = pendingOrder.shipping.name || '';
        shippingAddressEl.textContent = [pendingOrder.shipping.address, pendingOrder.shipping.city, pendingOrder.shipping.pincode]
            .filter(Boolean).join(', ');
        shippingPhoneEl.textContent = pendingOrder.shipping.phone || '';
    }

    const paymentForm = document.getElementById('payment-form');
    const submitBtn = document.getElementById('payment-submit-btn');

    paymentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing Payment...';

        setTimeout(() => {
            const paymentId = 'PAY-' + Math.random().toString(36).slice(2, 10).toUpperCase();
            const order = ShrinzaStore.addOrder({
                customerId: pendingOrder.customerId,
                customerMobile: pendingOrder.customerMobile,
                customerEmail: pendingOrder.customerEmail,
                items: pendingOrder.items,
                amount: pendingOrder.amount,
                shipping: pendingOrder.shipping,
                paymentStatus: 'paid',
                paymentId: paymentId,
                orderStatus: 'pending'
            });

            ShrinzaStore.clearPendingOrder();
            localStorage.removeItem('shrinza_cart');

            flow.classList.add('hidden');
            successView.classList.remove('hidden');
            document.getElementById('success-order-id').textContent = order.orderId;
            document.getElementById('success-amount-paid').textContent = '₹' + order.amount.toLocaleString('en-IN');
        }, 1600);
    });
});
