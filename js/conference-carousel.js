document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.conference-carousel');
    if (!carousel) {
        return;
    }

    const slides = Array.from(carousel.querySelectorAll('.conference-carousel-slide'));
    const indicators = Array.from(carousel.parentElement.querySelectorAll('.conference-carousel-indicators .indicator'));
    const prevBtn = carousel.querySelector('.prev-btn');
    const nextBtn = carousel.querySelector('.next-btn');
    let currentSlide = 0;
    let autoSlideTimer = null;
    const autoSlideDelay = 5000;

    const updateSlide = (index) => {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === index);
        });
        currentSlide = index;
    };

    const nextSlide = () => {
        const nextIndex = (currentSlide + 1) % slides.length;
        updateSlide(nextIndex);
    };

    const prevSlide = () => {
        const prevIndex = (currentSlide - 1 + slides.length) % slides.length;
        updateSlide(prevIndex);
    };

    const stopAutoSlide = () => {
        if (autoSlideTimer) {
            clearInterval(autoSlideTimer);
            autoSlideTimer = null;
        }
    };

    const startAutoSlide = () => {
        stopAutoSlide();
        autoSlideTimer = setInterval(nextSlide, autoSlideDelay);
    };

    prevBtn.addEventListener('click', () => {
        prevSlide();
        startAutoSlide();
    });
    nextBtn.addEventListener('click', () => {
        nextSlide();
        startAutoSlide();
    });

    indicators.forEach((indicator) => {
        indicator.addEventListener('click', () => {
            const index = Number(indicator.dataset.slide || 0);
            updateSlide(index);
            startAutoSlide();
        });
    });

    carousel.addEventListener('mouseenter', stopAutoSlide);
    carousel.addEventListener('mouseleave', startAutoSlide);

    startAutoSlide();
});
