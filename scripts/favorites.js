// Lightweight favorites toggle for pages without the cart/favorites drawer
// (category pages, Shop All). Reads/writes the same 'shrinza_favorites'
// localStorage key as scripts/main.js, so hearts stay in sync with the
// favorites drawer on the home page.
document.addEventListener('DOMContentLoaded', () => {
    const toggleButtons = document.querySelectorAll('.favorite-toggle-btn');
    if (!toggleButtons.length) return;

    let favorites = JSON.parse(localStorage.getItem('shrinza_favorites')) || [];

    const syncActiveState = () => {
        toggleButtons.forEach(btn => {
            btn.classList.toggle('active', favorites.includes(btn.dataset.id));
        });
    };

    toggleButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = btn.dataset.id;
            const index = favorites.indexOf(id);
            if (index > -1) {
                favorites.splice(index, 1);
            } else {
                favorites.push(id);
            }
            localStorage.setItem('shrinza_favorites', JSON.stringify(favorites));
            syncActiveState();
        });
    });

    syncActiveState();
});
