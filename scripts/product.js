// Product Detail Page — reads ?id= from the URL, renders the matching
// garment from the shared catalog (scripts/catalog.js), and wires up
// size selection, Add to Cart / Buy Now (via the global window.ShrinzaCart
// API main.js exposes), and the WhatsApp consult link.
//
// Runs as plain top-level code (not wrapped in DOMContentLoaded) because its
// <script> tag sits after all the page markup, so the DOM it touches already
// exists — and it must finish setting #product-favorite-btn's data-id before
// main.js's own DOMContentLoaded handler wires up favorite buttons.
(function () {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    const product = (typeof SHRINZA_PRODUCTS !== 'undefined') ? SHRINZA_PRODUCTS[productId] : null;

    const detailSection = document.getElementById('product-detail-section');
    const notFoundSection = document.getElementById('product-not-found');

    if (!product) {
        if (detailSection) detailSection.classList.add('hidden');
        if (notFoundSection) notFoundSection.classList.remove('hidden');
        return;
    }

    document.title = 'SHRINZA | ' + product.name;

    const categoryLabel = document.getElementById('product-category-label');
    const breadcrumbCategory = document.getElementById('product-breadcrumb-category');
    const image = document.getElementById('product-image');
    const title = document.getElementById('product-title');
    const priceEl = document.getElementById('product-price');
    const description = document.getElementById('product-description');
    const favoriteBtn = document.getElementById('product-favorite-btn');
    const whatsappConsult = document.getElementById('product-whatsapp-consult');

    if (categoryLabel) categoryLabel.textContent = product.category;
    if (breadcrumbCategory) {
        breadcrumbCategory.textContent = product.category;
        breadcrumbCategory.href = product.categoryUrl;
    }
    if (image) {
        image.src = product.img;
        image.alt = product.name;
    }
    if (title) title.textContent = product.name;
    if (description) description.textContent = product.desc;
    if (favoriteBtn) favoriteBtn.dataset.id = productId;

    if (whatsappConsult) {
        const consultMessage = encodeURIComponent(`Hi, I'd like to consult the studio about the ${product.name}.`);
        whatsappConsult.href = `https://wa.me/919891614960?text=${consultMessage}`;
    }

    const addToCartBtn = document.getElementById('product-add-to-cart');
    const buyNowBtn = document.getElementById('product-buy-now');

    if (priceEl) {
        if (product.priceOnRequest) {
            const priceMessage = encodeURIComponent(`Hi, I'd like to know the price for the ${product.name}.`);
            priceEl.innerHTML = `<a href="https://wa.me/919891614960?text=${priceMessage}" target="_blank" rel="noopener" class="product-detail-price-link">Price on Request</a>`;
            // No numeric price to add to a cart total — the WhatsApp consult link is the CTA instead.
            if (addToCartBtn) addToCartBtn.classList.add('hidden');
            if (buyNowBtn) buyNowBtn.classList.add('hidden');
        } else {
            priceEl.textContent = '₹' + product.price.toLocaleString('en-IN');
        }
    }

    // --- Size selection ---
    let selectedSize = 'M';
    const sizeChips = document.querySelectorAll('.product-size-chip');
    sizeChips.forEach(chip => {
        chip.addEventListener('click', () => {
            sizeChips.forEach(c => c.classList.remove('is-selected'));
            chip.classList.add('is-selected');
            selectedSize = chip.dataset.size;
        });
    });

    // --- Add to Cart / Buy Now ---
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            if (!window.ShrinzaCart) return;
            window.ShrinzaCart.addToCart(productId, selectedSize, 1);
            window.ShrinzaCart.openCartDrawer();
        });
    }

    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', () => {
            if (!window.ShrinzaCart) return;
            window.ShrinzaCart.addToCart(productId, selectedSize, 1);
            window.ShrinzaCart.startCheckout();
        });
    }

    // --- Description / Shipping Information accordion ---
    document.querySelectorAll('.product-accordion-trigger').forEach(trigger => {
        trigger.addEventListener('click', () => {
            const panel = trigger.nextElementSibling;
            const isOpen = trigger.classList.toggle('is-open');
            trigger.setAttribute('aria-expanded', isOpen);
            panel.classList.toggle('hidden', !isOpen);
            trigger.querySelector('.product-accordion-icon').innerHTML = isOpen ? '&minus;' : '&plus;';
        });
    });
})();
