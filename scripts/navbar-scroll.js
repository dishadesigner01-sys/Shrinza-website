// Solid white navbar with dark text once the page scrolls — keeps the
// hero-overlay transparent/white-text look only at the very top. On index.html
// this also slides the announcement bar away so the navbar can take its place.
document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('.navbar')) return;

    const toggleScrolled = () => {
        document.body.classList.toggle('page-scrolled', window.scrollY > 40);
    };

    window.addEventListener('scroll', toggleScrolled, { passive: true });
    toggleScrolled();
});
