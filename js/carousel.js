class HDRCarousel {
    constructor(container) {
        this.container = container;
        this.slides = container.querySelectorAll('.carousel-slide');
        this.indicators = container.querySelectorAll('.indicator');
        this.prevBtn = container.querySelector('.prev-btn');
        this.nextBtn = container.querySelector('.next-btn');
        this.wrapper = container.querySelector('.carousel-wrapper');
        
        this.currentSlide = 0;
        this.autoPlayInterval = null;
        this.autoPlayDuration = 50000;
        
        this.init();
    }

    init() {
        this.prevBtn.addEventListener('click', () => this.prevSlide());
        this.nextBtn.addEventListener('click', () => this.nextSlide());

        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.goToSlide(index));
        });

        this.startAutoPlay();
        this.updateSlideDisplay();
    }

    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
        this.updateSlideDisplay();
        this.resetAutoPlay();
    }

    prevSlide() {
        this.currentSlide = this.currentSlide === 0 ? this.slides.length - 1 : this.currentSlide - 1;
        this.updateSlideDisplay();
        this.resetAutoPlay();
    }

    goToSlide(index) {
        this.currentSlide = index;
        this.updateSlideDisplay();
        this.resetAutoPlay();
    }

    updateSlideDisplay() {
        this.slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === this.currentSlide);
        });

        this.indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === this.currentSlide);
        });
    }

    startAutoPlay() {
        this.autoPlayInterval = setInterval(() => this.nextSlide(), this.autoPlayDuration);
    }

    resetAutoPlay() {
        clearInterval(this.autoPlayInterval);
        setTimeout(() => this.startAutoPlay(), 1000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const carouselContainer = document.querySelector('.hdr-carousel-section');
    if (carouselContainer) {
        window.hdrCarousel = new HDRCarousel(carouselContainer);
    }
});
