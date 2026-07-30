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

    function runProductSearch(query) {
        const term = query.trim().toLowerCase();
        if (!term) return;

        filterBtns.forEach(b => b.classList.remove('active'));
        const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
        if (allBtn) allBtn.classList.add('active');

        let matchCount = 0;
        productCards.forEach(card => {
            const title = card.querySelector('.product-title');
            const titleText = title ? title.textContent.toLowerCase() : '';
            const category = (card.dataset.category || '').toLowerCase();
            const isMatch = titleText.includes(term) || category.includes(term);
            card.style.display = isMatch ? 'block' : 'none';
            if (isMatch) matchCount++;
        });

        if (searchNoResults) searchNoResults.classList.toggle('hidden', matchCount > 0);

        closeAllModals();
        const featuredSection = document.getElementById('featured');
        if (featuredSection) featuredSection.scrollIntoView({ behavior: 'smooth' });
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

    // --- Brand Logo Customizer Logic ---
    const logoTemplates = {
        "option-1": `
            <svg class="logo-symbol" viewBox="0 0 200 50" aria-label="SHRINZA Logo">
                <defs>
                    <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#8E6E34" /><stop offset="30%" stop-color="#DAA520" /><stop offset="70%" stop-color="#F5D061" /><stop offset="100%" stop-color="#8E6E34" />
                    </linearGradient>
                </defs>
                <path class="logo-thread" d="M12 36 C 22 34, 30 45, 44 26 C 54 12, 66 35, 78 18 C 82 11, 82 11, 82 11 C 82 11, 92 5, 100 15 C 108 25, 120 18, 128 32 C 136 46, 146 35, 158 38 C 168 40, 178 30, 188 35" fill="none" stroke="url(#logoGold)" stroke-width="1.8" stroke-linecap="round" opacity="0.85" />
                <text y="34" fill="url(#logoGold)" text-anchor="end">
                    <tspan x="73" font-family="'Cormorant Garamond', serif" font-size="26" font-weight="500" letter-spacing="3.5" font-style="italic">Shrin</tspan>
                </text>
                <path class="logo-needle" d="M 80.5 13.5 C 80.5 8, 83.5 8, 83.5 13.5 L 82.5 39 L 82.0 45 L 81.5 39 Z" fill="url(#logoGold)" />
                <circle cx="82" cy="13" r="0.75" fill="#fff" />
                <text y="34" fill="url(#logoGold)">
                    <tspan x="88" font-family="'Cormorant Garamond', serif" font-size="26" font-weight="500" letter-spacing="3.5" font-style="italic">za</tspan>
                </text>
            </svg>
        `,
        "option-2": `
            <svg class="logo-symbol option-fashion-crest" viewBox="0 0 240 50" aria-label="SHRINZA Fashion Atelier Monogram">
                <defs>
                    <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#8E6E34" /><stop offset="30%" stop-color="#DAA520" /><stop offset="70%" stop-color="#F5D061" /><stop offset="100%" stop-color="#8E6E34" />
                    </linearGradient>
                </defs>
                <g transform="translate(5, 0)" display="none">
                    <circle cx="25" cy="18" r="9" fill="none" stroke="url(#logoGold)" stroke-width="0.8" stroke-dasharray="1.5, 1.5" opacity="0.65" />
                    <path d="M22.5 13 L25 5 L27.5 13 Z" fill="url(#logoGold)" />
                    <circle cx="25" cy="13.5" r="2.2" fill="url(#logoGold)" />
                    <path d="M 23.5 16.5 Q 25 18 26.5 16.5" fill="none" stroke="url(#logoGold)" stroke-width="0.8" />
                    <path d="M22 17.5 L28 17.5 L29 23 L21 23 Z" fill="url(#logoGold)" />
                    <path d="M22 17.5 C18 17.5, 15 19.5, 15 22.5 M 15 22.5 V20.5" fill="none" stroke="url(#logoGold)" stroke-width="1" stroke-linecap="round" />
                    <path d="M15 19 C13.5 19, 12.5 20.5, 15 21.8 C17.5 20.5, 16.5 19, 15 19 Z M12.5 20.8 C12.5 20.8, 15 19, 17.5 20.8" fill="url(#logoGold)" />
                    <path d="M28 17.5 C32 17.5, 35 19.5, 35 22.5 M 35 22.5 V20.5" fill="none" stroke="url(#logoGold)" stroke-width="1" stroke-linecap="round" />
                    <path d="M35 19 C33.5 19, 32.5 20.5, 35 21.8 C37.5 20.5, 36.5 19, 35 19 Z M32.5 20.8 C32.5 20.8, 35 19, 37.5 20.8" fill="url(#logoGold)" />
                    <path d="M 21.5 22.8 L 19.2 27.5" fill="none" stroke="url(#logoGold)" stroke-width="1" stroke-linecap="round" />
                    <circle cx="18" cy="30.5" r="1.1" fill="url(#logoGold)" />
                    <circle cx="17.2" cy="33.5" r="1.1" fill="url(#logoGold)" />
                    <circle cx="16.5" cy="36.5" r="1.1" fill="url(#logoGold)" />
                    <path d="M 28.5 22.8 L 30.5 20.5" fill="none" stroke="url(#logoGold)" stroke-width="1" stroke-linecap="round" />
                    <path d="M21 23 C 17.5 23, 15.5 28.5, 21 30.5 C 24.5 31.5, 25.5 29.5, 25 29.5 C 24.5 29.5, 25.5 31.5, 29 30.5 C 34.5 28.5, 32.5 23, 29 23" fill="none" stroke="url(#logoGold)" stroke-width="1.6" stroke-linecap="round" />
                    <path d="M12 29.5 C12 29.5, 16 37.5, 25 37.5 C34 37.5, 38 29.5, 38 29.5 C34 32.5, 31 33.5, 25 33.5 C19 33.5, 16 32.5, 12 29.5 Z" fill="url(#logoGold)" />
                    <path d="M6 30.5 C10 39, 17 43, 25 43 C33 43, 40 39, 44 30.5 C35 36.5, 15 36.5, 6 30.5 Z" fill="url(#logoGold)" opacity="0.8" />
                </g>
                <path d="M42 7 L21 42 L24.2 39.7 L43.5 7.8 Z" fill="url(#logoGold)" />
                <ellipse cx="42.1" cy="10.5" rx="1.1" ry="1.5" fill="#800020" transform="rotate(31 42.1 10.5)" />
                <path class="logo-thread" d="M39.5 14 C28 5, 15 11, 17 22 C19 33, 35 31, 35 22 C35 16, 28 15, 24 20" fill="none" stroke="url(#logoGold)" stroke-width="1.25" stroke-linecap="round" />
                <text y="34" fill="url(#logoGold)">
                    <tspan x="58" font-family="'Cormorant Garamond', serif" font-size="24" font-weight="500" letter-spacing="3.2">SHRINZA</tspan>
                </text>
                <path d="M61 39 L205 39" stroke="url(#logoGold)" stroke-width="0.55" stroke-linecap="round" opacity="0.75" />
            </svg>
        `,
        "option-3": `
            <svg class="logo-symbol option-calligraphic" viewBox="0 0 240 50" aria-label="SHRINZA Monogram Logo">
                <defs>
                    <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#8E6E34" /><stop offset="30%" stop-color="#DAA520" /><stop offset="70%" stop-color="#F5D061" /><stop offset="100%" stop-color="#8E6E34" />
                    </linearGradient>
                </defs>
                <path class="logo-needle" d="M 28 5 L 23 45 C 22.8 47 24.2 47 24.5 45 L 29.5 5 Z M27.8 9 C 27.8 7 29.2 7 29.2 9 C 29.2 11 27.8 11 27.8 9 Z" fill="url(#logoGold)" fill-rule="evenodd" />
                <path class="logo-thread" d="M 40 12 C 40 4, 18 4, 18 16 C 18 28, 42 22, 42 34 C 42 44, 20 44, 16 38" fill="none" stroke="url(#logoGold)" stroke-width="2.5" stroke-linecap="round" />
                <text y="34" fill="url(#logoGold)">
                    <tspan x="58" font-family="'Cormorant Garamond', serif" font-size="26" font-weight="500" letter-spacing="3.5" font-style="italic">Shrinza</tspan>
                </text>
            </svg>
        `,
        "option-4": `
            <svg class="logo-symbol option-minimalist" viewBox="0 0 240 50" aria-label="SHRINZA Minimalist Logo">
                <defs>
                    <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#8E6E34" /><stop offset="30%" stop-color="#DAA520" /><stop offset="70%" stop-color="#F5D061" /><stop offset="100%" stop-color="#8E6E34" />
                    </linearGradient>
                </defs>
                <path class="logo-needle" d="M 12 25 L 42 25 M 39 23 L 39 27 C 39.5 27 40.5 26.5 40.5 25 C 40.5 23.5 39.5 23 39 23 Z" fill="none" stroke="url(#logoGold)" stroke-width="1.5" stroke-linecap="round" />
                <circle cx="39.8" cy="25" r="0.4" fill="url(#logoGold)" />
                <path class="logo-thread" d="M 40 11 A 14 14 0 0 1 54 25 A 14 14 0 0 1 40 39" fill="none" stroke="url(#logoGold)" stroke-width="1.8" stroke-linecap="round" />
                <text y="34" fill="url(#logoGold)">
                    <tspan x="65" font-family="'Cormorant Garamond', serif" font-size="26" font-weight="500" letter-spacing="3.5" font-style="italic">Shrinza</tspan>
                </text>
            </svg>
        `
    };

    const navbarLogoHolder = document.getElementById('navbar-logo-svg-holder');
    const footerLogoHolder = document.getElementById('footer-logo-svg-holder');
    const splashLogoHolder = document.getElementById('splash-logo-svg-holder');
    const customizerPanel = document.getElementById('logo-customizer-panel');
    const customizerClose = document.getElementById('logo-customizer-close');
    const customizerTrigger = document.getElementById('logo-customizer-trigger');
    const optionCards = document.querySelectorAll('.logo-option-card');

    function applyLogoChoice(logoId) {
        if (!logoTemplates[logoId]) return;

        let navHtml = logoTemplates[logoId];
        let footerHtml = logoTemplates[logoId];

        // Specific gradient adjustment for footer
        footerHtml = footerHtml.replaceAll('logoGold', 'logoGoldFooter');

        if (navbarLogoHolder) navbarLogoHolder.innerHTML = navHtml;
        if (footerLogoHolder) footerLogoHolder.innerHTML = footerHtml;

        // Highlight selected option card
        optionCards.forEach(card => {
            if (card.dataset.logoVal === logoId) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }

    if (customizerTrigger) {
        customizerTrigger.addEventListener('click', () => {
            customizerPanel.classList.toggle('open');
        });
    }

    if (customizerClose) {
        customizerClose.addEventListener('click', () => {
            customizerPanel.classList.remove('open');
        });
    }

    optionCards.forEach(card => {
        card.addEventListener('click', (e) => {
            const logoVal = e.currentTarget.dataset.logoVal;
            applyLogoChoice(logoVal);
            localStorage.setItem('shrinza_logo_choice', logoVal);
        });
    });

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
    applyLogoChoice('option-2');

    const splashScreen = document.getElementById('splash-screen');
    const dismissSplash = () => {
        if (!splashScreen) return;
        window.setTimeout(() => {
            splashScreen.classList.add('is-hidden');
            document.body.style.overflow = '';
        }, 2200);
    };

    // Lock scroll during splash
    document.body.style.overflow = 'hidden';

    if (document.readyState === 'complete') {
        dismissSplash();
    } else {
        window.addEventListener('load', dismissSplash, { once: true });
    }
});

