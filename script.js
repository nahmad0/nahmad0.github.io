document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('header nav');

    hamburger.addEventListener('click', () => {
        nav.classList.toggle('active');
    });
});
