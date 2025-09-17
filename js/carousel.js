// HDR Carousel JavaScript
class HDRCarousel {
    constructor(container) {
        this.container = container;
        this.slides = container.querySelectorAll('.carousel-slide');
        this.indicators = container.querySelectorAll('.indicator');
        this.prevBtn = container.querySelector('.prev-btn');
        this.nextBtn = container.querySelector('.next-btn');
        this.wrapper = container.querySelector('.carousel-wrapper');
        
        this.currentSlide = 0;
        this.isTransitioning = false;
        this.autoPlayInterval = null;
        this.autoPlayDuration = 5000; // 5 seconds
        
        this.init();
    }
    
    init() {
        this.prevBtn.addEventListener('click', () => this.prevSlide());
        this.nextBtn.addEventListener('click', () => this.nextSlide());
        
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.goToSlide(index));
        });
        
        this.container.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        this.wrapper.addEventListener('mouseenter', () => this.pauseAutoPlay());
        this.wrapper.addEventListener('mouseleave', () => this.startAutoPlay());
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAutoPlay();
            } else {
                this.startAutoPlay();
            }
        });
        
        this.preloadImages();
        this.startAutoPlay();
        
        this.updateSlideDisplay();
    }
    
    preloadImages() {
        this.slides.forEach(slide => {
            const img = slide.querySelector('img');
            if (img) {
                img.addEventListener('load', () => {
                    img.classList.add('loaded');
                });
                
                if (img.complete) {
                    img.classList.add('loaded');
                }
            }
        });
    }
    
    nextSlide() {
        if (this.isTransitioning) return;
        
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
        this.updateSlideDisplay();
        this.resetAutoPlay();
    }
    
    prevSlide() {
        if (this.isTransitioning) return;
        
        this.currentSlide = this.currentSlide === 0 
            ? this.slides.length - 1 
            : this.currentSlide - 1;
        this.updateSlideDisplay();
        this.resetAutoPlay();
    }
    
    goToSlide(index) {
        if (this.isTransitioning || index === this.currentSlide) return;
        
        this.currentSlide = index;
        this.updateSlideDisplay();
        this.resetAutoPlay();
    }
    
    updateSlideDisplay() {
        this.isTransitioning = true;
        
        // Update slides
        this.slides.forEach((slide, index) => {
            slide.classList.remove('active', 'prev');
            
            if (index === this.currentSlide) {
                slide.classList.add('active');
            } else if (index === this.currentSlide - 1 || 
                      (this.currentSlide === 0 && index === this.slides.length - 1)) {
                slide.classList.add('prev');
            }
        });
        
        // Update indicators
        this.indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentSlide);
        });
        
        // Reset transition flag after animation completes
        setTimeout(() => {
            this.isTransitioning = false;
        }, 600);
    }
    
    handleKeydown(e) {
        if (e.target.closest('.carousel-wrapper')) {
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.prevSlide();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextSlide();
                    break;
                case ' ':
                case 'Enter':
                    if (e.target.classList.contains('indicator')) {
                        e.preventDefault();
                        const index = Array.from(this.indicators).indexOf(e.target);
                        this.goToSlide(index);
                    }
                    break;
                case 'Home':
                    e.preventDefault();
                    this.goToSlide(0);
                    break;
                case 'End':
                    e.preventDefault();
                    this.goToSlide(this.slides.length - 1);
                    break;
            }
        }
    }
    
    startAutoPlay() {
        if (this.autoPlayInterval) return;
        
        this.wrapper.classList.add('auto-playing');
        this.autoPlayInterval = setInterval(() => {
            this.nextSlide();
        }, this.autoPlayDuration);
    }
    
    pauseAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
            this.wrapper.classList.remove('auto-playing');
        }
    }
    
    resetAutoPlay() {
        this.pauseAutoPlay();
        setTimeout(() => {
            this.startAutoPlay();
        }, 1000); // Wait 1 second before restarting auto-play
    }
    
    // Method to destroy carousel (useful for cleanup)
    destroy() {
        this.pauseAutoPlay();
        
        this.prevBtn.removeEventListener('click', () => this.prevSlide());
        this.nextBtn.removeEventListener('click', () => this.nextSlide());
        this.wrapper.removeEventListener('mouseenter', () => this.pauseAutoPlay());
        this.wrapper.removeEventListener('mouseleave', () => this.startAutoPlay());
        this.container.removeEventListener('keydown', (e) => this.handleKeydown(e));
        
        this.indicators.forEach((indicator) => {
            indicator.removeEventListener('click', () => {});
        });
    }
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const carouselContainer = document.querySelector('.hdr-carousel-section');
    
    if (carouselContainer) {
        // Initialize the carousel
        const carousel = new HDRCarousel(carouselContainer);
        
        // Optional: carousel debugging
        window.hdrCarousel = carousel;
        
        // Add smooth scrolling
        const carouselLinks = document.querySelectorAll('a[href*="#carousel"]');
        carouselLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                carouselContainer.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            });
        });
        
        const observerOptions = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };
        
        const carouselObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Carousel is visible, ensure auto-play is active
                    if (!document.hidden) {
                        carousel.startAutoPlay();
                    }
                } else {
                    // Carousel is not visible, pause auto-play for performance
                    carousel.pauseAutoPlay();
                }
            });
        }, observerOptions);
        
        carouselObserver.observe(carouselContainer);
    }
    
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const carousel = window.hdrCarousel;
        if (carousel) {
            carousel.pauseAutoPlay();
            
            const style = document.createElement('style');
            style.textContent = `
                .carousel-slide {
                    transition-duration: 0.3s !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
});

class TouchHandler {
    constructor(carousel) {
        this.carousel = carousel;
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;
        this.minSwipeDistance = 50;
        
        this.init();
    }
    
    init() {
        const wrapper = this.carousel.wrapper;
        
        wrapper.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        wrapper.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
        wrapper.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
    }
    
    handleTouchStart(e) {
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
    }
    
    handleTouchMove(e) {
        if (!this.startX || !this.startY) return;
        
        this.endX = e.touches[0].clientX;
        this.endY = e.touches[0].clientY;
    }
    
    handleTouchEnd(e) {
        if (!this.startX || !this.startY) return;
        
        const deltaX = this.endX - this.startX;
        const deltaY = this.endY - this.startY;
        
        // Check if horizontal swipe is more significant than vertical
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (Math.abs(deltaX) > this.minSwipeDistance) {
                if (deltaX > 0) {
                   
                    this.carousel.prevSlide();
                } else {
                    this.carousel.nextSlide();
                }
            }
        }
        
        // Reset values
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const carousel = window.hdrCarousel;
        if (carousel && 'ontouchstart' in window) {
            new TouchHandler(carousel);
        }
    }, 100);
});
