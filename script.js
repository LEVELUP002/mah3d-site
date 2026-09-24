```javascript
// MOBILE MENU
const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");

menuToggle.addEventListener("click", () => {
    navMenu.classList.toggle("open");
});


// CLOSE MOBILE MENU AFTER CLICK
document.querySelectorAll("nav a").forEach(link => {
    link.addEventListener("click", () => {
        navMenu.classList.remove("open");
    });
});


// BACK TO TOP
const topButton = document.getElementById("topButton");

window.addEventListener("scroll", () => {

    if (window.scrollY > 500) {
        topButton.classList.add("show");
    } else {
        topButton.classList.remove("show");
    }

});

topButton.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});


// DOWNLOAD PLACEHOLDER
function comingSoon(event) {

    event.preventDefault();

    alert(
        "MAH3D: This download will be available soon."
    );
}


// SIMPLE REVEAL ANIMATION
const observer = new IntersectionObserver(
    entries => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";

            }

        });

    },
    {
        threshold: 0.12
    }
);


// Apply animation to cards
document
    .querySelectorAll(
        ".service-card, .download-item, .contact-card, .feature-box, .about-box"
    )
    .forEach(element => {

        element.style.opacity = "0";
        element.style.transform = "translateY(25px)";
        element.style.transition = "opacity .7s ease, transform .7s ease";

        observer.observe(element);

    });
```
