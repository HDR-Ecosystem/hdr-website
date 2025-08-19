document.addEventListener('DOMContentLoaded', () => {
    // Select the main section and all the number elements
    const numbersSection = document.querySelector('.numbers-section');
    const numberItems = document.querySelectorAll('.number-value');

    // A function to animate a single number
    const animateCount = (element) => {
        const target = +element.getAttribute('data-target');
        const duration = 2000; // Animation duration 2 seconds
        let startTime = null;

        const animate = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const currentValue = Math.floor(progress * target);
            element.textContent = currentValue;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // The section is in view, start the animations
                numberItems.forEach(item => {
                    animateCount(item);
                });
                
                // Disconnect the observer to ensure the animation only runs once
                observer.disconnect();
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, {
        root: null, // The viewport is the root
        rootMargin: '0px',
        threshold: 0.5 // Trigger when 50% of the section is visible
    });

    if (numbersSection) {
        observer.observe(numbersSection);
    }
});

