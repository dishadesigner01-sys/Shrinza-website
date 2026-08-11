document.addEventListener('DOMContentLoaded', () => {
    // --- Product Database ---
    const PRODUCTS = {
        "1": { name: "Royal Velvet Gown", price: 12999, img: "assets/product1.png", desc: "Crafted in heavy royal velvet, this Indo-Western fusion gown features premium hand embroidery along the borders and classic necklines." },
        "2": { name: "Floral Crop Set", price: 8499, img: "assets/product2.png", desc: "A fresh and modern silhouette featuring a floral embroidered crop top with a flared georgette skirt. Perfect for light festivities." },
        "3": { name: "Fusion Drape Saree", price: 15000, img: "assets/product3.png", desc: "Bringing together structural drapes and classic saree folds, this pre-stitched fusion drape saree offers unmatched elegance with absolute comfort." },
        "4": { name: "Emerald Heritage Lehenga", price: 45999, img: "assets/bridal-specialty.png", desc: "A masterpiece design from the SHRINZA bridal line. Features a deep emerald color block, zardozi gold threadwork, and an organza dupatta." }
    };

    // --- State Storage ---
    let cart = JSON.parse(localStorage.getItem('shrinza_cart')) || [];
    let currentQuickViewProductId = null;

    // --- Smooth Scrolling for Anchor Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const dest = document.querySelector(this.getAttribute('href'));
            if (dest) {
                e.preventDefault();
                dest.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // --- Cart System ---
    const cartDrawer = document.getElementById('cart-drawer');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartToggle = document.getElementById('cart-toggle-btn');
    const cartClose = document.getElementById('cart-close-btn');
    const cartItemsWrapper = document.getElementById('cart-items-container');
    const cartBadge = document.getElementById('cart-badge');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartSummary = document.getElementById('cart-summary');
    const checkoutBtn = document.getElementById('checkout-btn');

    function toggleCart(open = true) {
        if (open) {
            cartDrawer.classList.add('open');
            cartOverlay.classList.add('open');
            document.body.style.overflow = 'hidden';
            renderCart();
        } else {
            cartDrawer.classList.remove('open');
            cartOverlay.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    if (cartToggle) cartToggle.addEventListener('click', () => toggleCart(true));
    if (cartClose) cartClose.addEventListener('click', () => toggleCart(false));
    if (cartOverlay) cartOverlay.addEventListener('click', () => toggleCart(false));

    function saveCart() {
        localStorage.setItem('shrinza_cart', JSON.stringify(cart));
        updateCartUi();
    }

    function updateCartUi() {
        const totalItemsCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);
        if (cartBadge) {
            cartBadge.textContent = totalItemsCount;
            cartBadge.style.display = totalItemsCount > 0 ? 'flex' : 'none';
        }
    }

    function addToCart(id, size = 'M', quantity = 1) {
        const product = PRODUCTS[id];
        if (!product) return;

        const existingItemIndex = cart.findIndex(item => item.id === id && item.size === size);
        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += quantity;
        } else {
            cart.push({
                id: id,
                name: product.name,
                price: product.price,
                img: product.img,
                size: size,
                quantity: quantity
            });
        }
        saveCart();
        renderCart();
        toggleCart(true);
    }

    function changeQuantity(id, size, delta) {
        const index = cart.findIndex(item => item.id === id && item.size === size);
        if (index > -1) {
            cart[index].quantity += delta;
            if (cart[index].quantity <= 0) {
                cart.splice(index, 1);
            }
            saveCart();
            renderCart();
        }
    }

    function renderCart() {
        cartItemsWrapper.innerHTML = '';
        if (cart.length === 0) {
            cartItemsWrapper.innerHTML = '<div class="cart-empty-message">Your shopping bag is currently empty.</div>';
            cartSummary.classList.add('hidden');
            return;
        }

        cartSummary.classList.remove('hidden');
        let subtotal = 0;

        cart.forEach(item => {
            subtotal += item.price * item.quantity;
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            itemEl.innerHTML = `
                <img src="${item.img}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <div>
                        <h4 class="cart-item-name">${item.name}</h4>
                        <p class="cart-item-meta">Size: ${item.size}</p>
                    </div>
                    <div class="cart-item-pricing">
                        <span class="cart-item-price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
                        <div class="cart-qty-control">
                            <button class="cart-qty-btn decrease-qty" data-id="${item.id}" data-size="${item.size}">-</button>
                            <span class="cart-qty-val">${item.quantity}</span>
                            <button class="cart-qty-btn increase-qty" data-id="${item.id}" data-size="${item.size}">+</button>
                        </div>
                    </div>
                </div>
            `;
            cartItemsWrapper.appendChild(itemEl);
        });

        if (cartSubtotal) {
            cartSubtotal.textContent = '₹' + subtotal.toLocaleString('en-IN');
        }

        // Add event listeners to quantities buttons
        cartItemsWrapper.querySelectorAll('.decrease-qty').forEach(btn => {
            btn.addEventListener('click', (e) => {
                changeQuantity(e.target.dataset.id, e.target.dataset.size, -1);
            });
        });

        cartItemsWrapper.querySelectorAll('.increase-qty').forEach(btn => {
            btn.addEventListener('click', (e) => {
                changeQuantity(e.target.dataset.id, e.target.dataset.size, 1);
            });
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) return;
            const session = ShrinzaStore.getSession();
            if (!session) {
                openAuthModal('checkout');
            } else {
                openCheckoutModal();
            }
        });
    }

    // Attach Add to Cart from collection cards directly
    document.querySelectorAll('.btn-add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = e.target.dataset.id;
            addToCart(id, 'M', 1);
        });
    });

    // --- Favorites System ---
    const favoritesDrawer = document.getElementById('favorites-drawer');
    const favoritesOverlay = document.getElementById('favorites-overlay');
    const favoritesToggle = document.getElementById('favorites-toggle-btn');
    const favoritesClose = document.getElementById('favorites-close-btn');
    const favoritesItemsWrapper = document.getElementById('favorites-items-container');
    const favoritesBadge = document.getElementById('favorites-badge');

    let favorites = JSON.parse(localStorage.getItem('shrinza_favorites')) || [];

    function toggleFavoritesDrawer(open = true) {
        if (open) {
            favoritesDrawer.classList.add('open');
            favoritesOverlay.classList.add('open');
            document.body.style.overflow = 'hidden';
            renderFavorites();
        } else {
            favoritesDrawer.classList.remove('open');
            favoritesOverlay.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    if (favoritesToggle) favoritesToggle.addEventListener('click', () => toggleFavoritesDrawer(true));
    if (favoritesClose) favoritesClose.addEventListener('click', () => toggleFavoritesDrawer(false));
    if (favoritesOverlay) favoritesOverlay.addEventListener('click', () => toggleFavoritesDrawer(false));

    function saveFavorites() {
        localStorage.setItem('shrinza_favorites', JSON.stringify(favorites));
        updateFavoritesUi();
    }

    function updateFavoritesUi() {
        if (favoritesBadge) {
            favoritesBadge.textContent = favorites.length;
            favoritesBadge.style.display = favorites.length > 0 ? 'flex' : 'none';
        }
        document.querySelectorAll('.favorite-toggle-btn').forEach(btn => {
            btn.classList.toggle('active', favorites.includes(btn.dataset.id));
        });
    }

    function toggleFavorite(id) {
        const index = favorites.indexOf(id);
        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(id);
        }
        saveFavorites();
        renderFavorites();
    }

    document.querySelectorAll('.favorite-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(btn.dataset.id);
        });
    });

    function renderFavorites() {
        favoritesItemsWrapper.innerHTML = '';
        if (favorites.length === 0) {
            favoritesItemsWrapper.innerHTML = '<div class="cart-empty-message">You haven\'t saved any favorites yet.</div>';
            return;
        }

        favorites.forEach(id => {
            const product = PRODUCTS[id];
            if (!product) return;
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            itemEl.innerHTML = `
                <img src="${product.img}" alt="${product.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <div>
                        <h4 class="cart-item-name">${product.name}</h4>
                        <p class="cart-item-meta">₹${product.price.toLocaleString('en-IN')}</p>
                    </div>
                    <div class="cart-item-pricing">
                        <button class="btn btn-add-to-cart favorite-add-to-cart" data-id="${id}"
                            style="width: auto; padding: 0.4rem 0.9rem; font-size: 0.7rem;">Add to Cart</button>
                        <button class="cart-qty-btn remove-favorite" data-id="${id}"
                            aria-label="Remove from Favorites">&times;</button>
                    </div>
                </div>
            `;
            favoritesItemsWrapper.appendChild(itemEl);
        });

        favoritesItemsWrapper.querySelectorAll('.remove-favorite').forEach(btn => {
            btn.addEventListener('click', () => toggleFavorite(btn.dataset.id));
        });

        favoritesItemsWrapper.querySelectorAll('.favorite-add-to-cart').forEach(btn => {
            btn.addEventListener('click', () => {
                addToCart(btn.dataset.id, 'M', 1);
                toggleFavoritesDrawer(false);
            });
        });
    }

    // --- Quick View Modal ---
    const qvModal = document.getElementById('quick-view-modal');
    const qvClose = document.getElementById('quick-view-close');
    const qvImage = document.getElementById('qv-image');
    const qvTitle = document.getElementById('qv-title');
    const qvPrice = document.getElementById('qv-price');
    const qvDescription = document.getElementById('qv-description');
    const qvSize = document.getElementById('qv-size');
    const qvAddBtn = document.getElementById('qv-add-to-cart');
    const modalOverlay = document.getElementById('modal-overlay');

    function openQuickView(id) {
        const product = PRODUCTS[id];
        if (!product) return;

        currentQuickViewProductId = id;
        if (qvImage) qvImage.src = product.img;
        if (qvTitle) qvTitle.textContent = product.name;
        if (qvPrice) qvPrice.textContent = '₹' + product.price.toLocaleString('en-IN');
        if (qvDescription) qvDescription.textContent = product.desc;
        if (qvSize) qvSize.selectedIndex = 1; // Default selector to Medium 'M'

        if (qvModal) qvModal.classList.add('open');
        if (modalOverlay) modalOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeAllModals() {
        if (qvModal) qvModal.classList.remove('open');
        const bridalModal = document.getElementById('bridal-modal');
        if (bridalModal) bridalModal.classList.remove('open');
        const authModalEl = document.getElementById('auth-modal');
        if (authModalEl) authModalEl.classList.remove('open');
        const checkoutModalEl = document.getElementById('checkout-modal');
        if (checkoutModalEl) checkoutModalEl.classList.remove('open');
        const searchModalEl = document.getElementById('search-modal');
        if (searchModalEl) searchModalEl.classList.remove('open');
        if (modalOverlay) modalOverlay.classList.remove('open');
        if (!cartDrawer.classList.contains('open')) {
            document.body.style.overflow = '';
        }
    }

    // --- Account / OTP Authentication ---
    const accountToggleBtn = document.getElementById('account-toggle-btn');
    const accountPanel = document.getElementById('account-panel');
    const accountLabel = document.getElementById('account-label');
    const accountPanelGuest = document.getElementById('account-panel-guest');
    const accountPanelUser = document.getElementById('account-panel-user');
    const accountCustomerName = document.getElementById('account-customer-name');
    const accountCustomerId = document.getElementById('account-customer-id');
    const accountCustomerMobile = document.getElementById('account-customer-mobile');
    const accountOpenAuthBtn = document.getElementById('account-open-auth-btn');
    const accountLogoutBtn = document.getElementById('account-logout-btn');

    const authModal = document.getElementById('auth-modal');
    const authModalTitle = document.getElementById('auth-modal-title');
    const authModalClose = document.getElementById('auth-modal-close');

    const authLoginForm = document.getElementById('auth-login-form');
    const authLoginMobileInput = document.getElementById('auth-login-mobile');
    const authGotoSignup = document.getElementById('auth-goto-signup');

    const authSignupForm = document.getElementById('auth-signup-form');
    const authSignupNotice = document.getElementById('auth-signup-notice');
    const authSignupNameInput = document.getElementById('auth-signup-name');
    const authSignupMobileInput = document.getElementById('auth-signup-mobile');
    const authSignupEmailInput = document.getElementById('auth-signup-email');
    const authSignupCityInput = document.getElementById('auth-signup-city');
    const authGotoLogin = document.getElementById('auth-goto-login');

    const authStepOtp = document.getElementById('auth-step-otp');
    const authOtpMobileDisplay = document.getElementById('auth-otp-mobile-display');
    const authOtpDemo = document.getElementById('auth-otp-demo');
    const authOtpInput = document.getElementById('auth-otp-input');
    const authOtpError = document.getElementById('auth-otp-error');
    const authChangeNumberBtn = document.getElementById('auth-change-number');
    const authResendOtp = document.getElementById('auth-resend-otp');

    const checkoutModal = document.getElementById('checkout-modal');
    const checkoutModalClose = document.getElementById('checkout-modal-close');
    const checkoutDetailsForm = document.getElementById('checkout-details-form');

    let authContext = 'login'; // 'login' or 'checkout' — what to do after a successful sign-in
    let authMode = 'login'; // 'login' or 'signup' — which details form is currently active
    let pendingAuthMobile = '';
    let pendingAuthEmail = '';
    let pendingAuthName = '';
    let pendingAuthCity = '';

    function renderAccountUi() {
        const session = ShrinzaStore.getSession();
        if (session) {
            if (accountPanelGuest) accountPanelGuest.classList.add('hidden');
            if (accountPanelUser) accountPanelUser.classList.remove('hidden');
            if (accountCustomerName) accountCustomerName.textContent = session.name || session.mobile;
            if (accountCustomerId) accountCustomerId.textContent = session.customerId;
            if (accountCustomerMobile) accountCustomerMobile.textContent = session.mobile;
            if (accountLabel) accountLabel.textContent = 'Account';
        } else {
            if (accountPanelGuest) accountPanelGuest.classList.remove('hidden');
            if (accountPanelUser) accountPanelUser.classList.add('hidden');
            if (accountLabel) accountLabel.textContent = 'Login';
        }
    }

    function toggleAccountPanel(open) {
        if (accountPanel) accountPanel.classList.toggle('open', open);
    }

    if (accountToggleBtn) {
        accountToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleAccountPanel(!accountPanel.classList.contains('open'));
        });
    }

    document.addEventListener('click', (e) => {
        if (accountPanel && accountPanel.classList.contains('open') && !e.target.closest('.account-menu')) {
            toggleAccountPanel(false);
        }
    });

    if (accountOpenAuthBtn) {
        accountOpenAuthBtn.addEventListener('click', () => {
            toggleAccountPanel(false);
            openAuthModal('login');
        });
    }

    if (accountLogoutBtn) {
        accountLogoutBtn.addEventListener('click', () => {
            ShrinzaStore.clearSession();
            renderAccountUi();
            toggleAccountPanel(false);
        });
    }

    function showLoginView() {
        authMode = 'login';
        if (authModalTitle) authModalTitle.textContent = 'Login';
        if (authLoginForm) authLoginForm.classList.remove('hidden');
        if (authSignupForm) authSignupForm.classList.add('hidden');
        if (authStepOtp) authStepOtp.classList.add('hidden');
        if (authSignupNotice) authSignupNotice.classList.add('hidden');
    }

    function showSignupView() {
        authMode = 'signup';
        if (authModalTitle) authModalTitle.textContent = 'Sign Up';
        if (authLoginForm) authLoginForm.classList.add('hidden');
        if (authSignupForm) authSignupForm.classList.remove('hidden');
        if (authStepOtp) authStepOtp.classList.add('hidden');
    }

    // Auth modal always opens on Login, with a Sign Up link at the bottom.
    function openAuthModal(context) {
        authContext = context || 'login';
        showLoginView();
        if (authOtpError) authOtpError.classList.add('hidden');
        if (authOtpInput) authOtpInput.value = '';
        if (authModal) authModal.classList.add('open');
        if (modalOverlay) modalOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    if (authModalClose) authModalClose.addEventListener('click', closeAllModals);

    if (authGotoSignup) {
        authGotoSignup.addEventListener('click', (e) => {
            e.preventDefault();
            showSignupView();
        });
    }

    if (authGotoLogin) {
        authGotoLogin.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginView();
        });
    }

    function goToOtpStep(mobile) {
        const otp = ShrinzaStore.generateOtp(mobile);
        if (authOtpMobileDisplay) authOtpMobileDisplay.textContent = mobile;
        if (authOtpDemo) authOtpDemo.textContent = 'Demo OTP (simulated, no SMS sent): ' + otp;
        if (authOtpError) authOtpError.classList.add('hidden');
        if (authOtpInput) authOtpInput.value = '';
        if (authLoginForm) authLoginForm.classList.add('hidden');
        if (authSignupForm) authSignupForm.classList.add('hidden');
        if (authStepOtp) authStepOtp.classList.remove('hidden');
        if (authOtpInput) authOtpInput.focus();
    }

    if (authLoginForm) {
        authLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            authMode = 'login';
            pendingAuthMobile = authLoginMobileInput.value.trim();
            pendingAuthEmail = '';
            pendingAuthName = '';
            pendingAuthCity = '';
            goToOtpStep(pendingAuthMobile);
        });
    }

    if (authSignupForm) {
        authSignupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            authMode = 'signup';
            pendingAuthName = authSignupNameInput.value.trim();
            pendingAuthMobile = authSignupMobileInput.value.trim();
            pendingAuthEmail = authSignupEmailInput.value.trim();
            pendingAuthCity = authSignupCityInput.value.trim();
            goToOtpStep(pendingAuthMobile);
        });
    }

    if (authChangeNumberBtn) {
        authChangeNumberBtn.addEventListener('click', () => {
            if (authMode === 'signup') {
                showSignupView();
            } else {
                showLoginView();
            }
        });
    }

    if (authResendOtp) {
        authResendOtp.addEventListener('click', (e) => {
            e.preventDefault();
            const otp = ShrinzaStore.generateOtp(pendingAuthMobile);
            if (authOtpDemo) authOtpDemo.textContent = 'Demo OTP (simulated, no SMS sent): ' + otp;
        });
    }

    if (authStepOtp) {
        authStepOtp.addEventListener('submit', (e) => {
            e.preventDefault();
            const result = ShrinzaStore.verifyOtp(pendingAuthMobile, authOtpInput.value.trim());
            if (!result.ok) {
                if (authOtpError) authOtpError.classList.remove('hidden');
                return;
            }

            let customer;
            if (authMode === 'login') {
                customer = ShrinzaStore.findCustomerByMobile(pendingAuthMobile);
                if (!customer) {
                    // No account for this number yet — send them to sign up, mobile pre-filled.
                    showSignupView();
                    if (authSignupMobileInput) authSignupMobileInput.value = pendingAuthMobile;
                    if (authSignupNotice) {
                        authSignupNotice.textContent = 'No account found for that number — please complete sign up below.';
                        authSignupNotice.classList.remove('hidden');
                    }
                    return;
                }
            } else {
                customer = ShrinzaStore.upsertCustomer({
                    name: pendingAuthName,
                    mobile: pendingAuthMobile,
                    email: pendingAuthEmail,
                    city: pendingAuthCity
                });
            }

            ShrinzaStore.setSession(customer);
            renderAccountUi();

            if (authContext === 'checkout') {
                closeAllModals();
                openCheckoutModal();
            } else {
                closeAllModals();
            }
        });
    }

    function openCheckoutModal() {
        const session = ShrinzaStore.getSession();
        const checkoutPhoneInput = document.getElementById('checkout-phone');
        const checkoutNameInput = document.getElementById('checkout-name');
        const checkoutCityInput = document.getElementById('checkout-city');
        if (session) {
            if (checkoutPhoneInput && !checkoutPhoneInput.value) checkoutPhoneInput.value = session.mobile;
            if (checkoutNameInput && !checkoutNameInput.value) checkoutNameInput.value = session.name || '';
            if (checkoutCityInput && !checkoutCityInput.value) checkoutCityInput.value = session.city || '';
        }
        toggleCart(false);
        if (checkoutModal) checkoutModal.classList.add('open');
        if (modalOverlay) modalOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    if (checkoutModalClose) checkoutModalClose.addEventListener('click', closeAllModals);

    if (checkoutDetailsForm) {
        checkoutDetailsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const session = ShrinzaStore.getSession();
            if (!session) {
                closeAllModals();
                openAuthModal('checkout');
                return;
            }
            const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
            const pendingOrder = {
                customerId: session.customerId,
                customerMobile: session.mobile,
                customerEmail: session.email,
                items: cart.map(item => ({ name: item.name, size: item.size, quantity: item.quantity, price: item.price, img: item.img })),
                amount: subtotal,
                shipping: {
                    name: document.getElementById('checkout-name').value.trim(),
                    phone: document.getElementById('checkout-phone').value.trim(),
                    address: document.getElementById('checkout-address').value.trim(),
                    city: document.getElementById('checkout-city').value.trim(),
                    pincode: document.getElementById('checkout-pincode').value.trim()
                }
            };
            ShrinzaStore.setPendingOrder(pendingOrder);
            window.location.href = 'payment.html';
        });
    }

    renderAccountUi();

    document.querySelectorAll('.btn-quick-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = e.target.dataset.id;
            openQuickView(id);
        });
    });

    if (qvClose) qvClose.addEventListener('click', closeAllModals);
    if (modalOverlay) modalOverlay.addEventListener('click', closeAllModals);

    if (qvAddBtn) {
        qvAddBtn.addEventListener('click', () => {
            if (currentQuickViewProductId) {
                const selectedSize = qvSize ? qvSize.value : 'M';
                addToCart(currentQuickViewProductId, selectedSize, 1);
                closeAllModals();
            }
        });
    }

    // --- Filter Controls ---
    const filterBtns = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const filterValue = e.target.dataset.filter;

            productCards.forEach(card => {
                const cat = card.dataset.category;
                if (filterValue === 'all' || cat === filterValue) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // --- Search ---
    const searchToggleBtn = document.getElementById('search-toggle-btn');
    const searchModal = document.getElementById('search-modal');
    const searchModalClose = document.getElementById('search-modal-close');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const searchChips = document.querySelectorAll('.search-chip');
    const searchNoResults = document.getElementById('search-no-results');

    function openSearchModal() {
        if (searchModal) searchModal.classList.add('open');
        if (modalOverlay) modalOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        if (searchInput) setTimeout(() => searchInput.focus(), 100);
    }

    if (searchToggleBtn) searchToggleBtn.addEventListener('click', openSearchModal);
    if (searchModalClose) searchModalClose.addEventListener('click', closeAllModals);

    // Maps search terms straight to the garment that best matches — either its
    // category page, or (for pieces that only live in the Bestsellers grid) an
    // anchor to scroll to and highlight on this page.
    const SEARCH_INDEX = [
        { keywords: ['saree', 'sari', 'fusion drape saree', 'drape saree'], url: 'category-sarees.html' },
        { keywords: ['bridal', 'bridal wear', 'bride', 'lehenga', 'emerald heritage lehenga', 'wedding lehenga', 'heritage lehenga'], url: 'category-bridal.html' },
        { keywords: ['gown', 'gowns', 'royal velvet gown', 'velvet gown', 'mint floral gown', 'mint gown', 'floral embroidered gown', 'mint floral embroidered'], url: 'category-gowns.html' },
        { keywords: ['evening', 'evening wear', 'floral crop set', 'crop set'], url: 'category-evening.html' },
        { keywords: ['jacket dhoti', 'dhoti set', 'beige jacket', 'indo-western jacket dhoti'], url: '#bestseller-jacket-dhoti' },
        { keywords: ['grey embroidered jacket', 'grey jacket lehenga', 'embroidered jacket lehenga', 'grey lehenga set'], url: '#bestseller-grey-lehenga' },
        { keywords: ['pink cape', 'cape sleeve', 'cape set', 'pink crop top', 'crop top skirt'], url: '#bestseller-pink-cape' }
    ];

    function findBestGarmentMatch(term) {
        let best = null;
        let bestScore = -1;
        SEARCH_INDEX.forEach(entry => {
            entry.keywords.forEach(kw => {
                let score = -1;
                if (term === kw) {
                    // Exact match always wins, regardless of what longer keywords
                    // elsewhere merely happen to contain this term as a substring.
                    score = 1000;
                } else if (kw.includes(term)) {
                    // Search term is a fragment of a longer keyword — prefer the
                    // tightest-fitting keyword (least leftover text).
                    score = 500 - (kw.length - term.length);
                } else if (term.includes(kw)) {
                    // Keyword is a fragment of a longer/plural search term.
                    score = 200 + kw.length;
                }
                if (score > bestScore) {
                    bestScore = score;
                    best = entry;
                }
            });
        });
        return best;
    }

    function scrollToAndHighlight(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('bestseller-highlight');
        window.setTimeout(() => el.classList.remove('bestseller-highlight'), 3600);
    }

    function runProductSearch(query) {
        const term = query.trim().toLowerCase();
        if (!term) return;

        const match = findBestGarmentMatch(term);

        if (!match) {
            if (searchNoResults) searchNoResults.classList.remove('hidden');
            return;
        }

        if (searchNoResults) searchNoResults.classList.add('hidden');
        closeAllModals();

        if (match.url.startsWith('#')) {
            scrollToAndHighlight(match.url.slice(1));
        } else {
            window.location.href = match.url;
        }
    }

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            runProductSearch(searchInput.value);
        });
    }

    searchChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const query = chip.dataset.query;
            if (searchInput) searchInput.value = query;
            runProductSearch(query);
        });
    });

    // --- Bridal Consultation Request Wizard ---
    const bridalModal = document.getElementById('bridal-modal');
    const bridalClose = document.getElementById('bridal-close');
    const consultationTriggers = document.querySelectorAll('.btn-trigger-consultation');
    const bridalForm = document.getElementById('bridal-consultation-form');
    const steps = bridalForm ? bridalForm.querySelectorAll('.form-step') : [];
    const stepDots = document.querySelectorAll('.step-dot');
    const successMsg = document.getElementById('booking-success-message');
    const successClose = document.getElementById('booking-success-close');

    let currentStep = 1;

    function openBridalModal() {
        currentStep = 1;
        resetBridalForm();
        if (bridalModal) bridalModal.classList.add('open');
        if (modalOverlay) modalOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    consultationTriggers.forEach(trig => {
        trig.addEventListener('click', openBridalModal);
    });

    if (bridalClose) bridalClose.addEventListener('click', closeAllModals);
    if (successClose) successClose.addEventListener('click', closeAllModals);

    function updateStepDisplay() {
        steps.forEach((step, idx) => {
            if (idx + 1 === currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        stepDots.forEach((dot, idx) => {
            const dotStep = parseInt(dot.dataset.step);
            dot.className = 'step-dot';
            if (dotStep === currentStep) {
                dot.classList.add('active');
            } else if (dotStep < currentStep) {
                dot.classList.add('completed');
            }
        });
    }

    function checkStepValidity() {
        const activeStepEl = bridalForm.querySelector(`.form-step[data-step="${currentStep}"]`);
        const inputs = activeStepEl.querySelectorAll('input[required], select[required]');
        let valid = true;
        inputs.forEach(input => {
            if (!input.checkValidity()) {
                input.reportValidity();
                valid = false;
            }
        });
        return valid;
    }

    if (bridalForm) {
        bridalForm.querySelectorAll('.next-step').forEach(btn => {
            btn.addEventListener('click', () => {
                if (checkStepValidity()) {
                    currentStep++;
                    updateStepDisplay();
                }
            });
        });

        bridalForm.querySelectorAll('.prev-step').forEach(btn => {
            btn.addEventListener('click', () => {
                currentStep--;
                updateStepDisplay();
            });
        });

        bridalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (checkStepValidity()) {
                const name = document.getElementById('client-name').value;
                const email = document.getElementById('client-email').value;

                document.getElementById('success-client-name').textContent = name;
                document.getElementById('success-client-email').textContent = email;

                bridalForm.classList.add('hidden');
                document.querySelector('.step-indicator').classList.add('hidden');
                successMsg.classList.remove('hidden');
            }
        });
    }

    function resetBridalForm() {
        if (bridalForm) {
            bridalForm.reset();
            bridalForm.classList.remove('hidden');
            const stepIndicator = document.querySelector('.step-indicator');
            if (stepIndicator) stepIndicator.classList.remove('hidden');
        }
        if (successMsg) successMsg.classList.add('hidden');
        updateStepDisplay();
    }

    // --- Footer Newsletter Signup ---
    const footerNewsletterForm = document.getElementById('splash-newsletter-form');
    if (footerNewsletterForm) {
        footerNewsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            footerNewsletterForm.classList.add('hidden');
            const successMsg = document.getElementById('splash-newsletter-success');
            if (successMsg) successMsg.classList.remove('hidden');
        });
    }

    // --- Onload Initialize ---
    updateCartUi();
    updateFavoritesUi();

    if (window.location.hash === '#start-consultation') {
        openBridalModal();
    }

    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
        if (window.location.hash) {
            // Arriving via a direct link to a specific section (e.g. the Contact
            // nav item) — skip the splash so the browser can jump straight there.
            splashScreen.classList.add('is-hidden');
        } else {
            document.body.style.overflow = 'hidden';
            const dismissSplash = () => {
                window.setTimeout(() => {
                    splashScreen.classList.add('is-hidden');
                    document.body.style.overflow = '';
                }, 2200);
            };

            if (document.readyState === 'complete') {
                dismissSplash();
            } else {
                window.addEventListener('load', dismissSplash, { once: true });
            }
        }
    }
});

