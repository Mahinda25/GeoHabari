// Episodes Carousel Class
export class EpisodesCarousel {
  constructor() {
    this.container = document.querySelector('.recenteps_episodes');
    this.prevButton = document.querySelector('.nav_button.prev');
    this.nextButton = document.querySelector('.nav_button.next');
    this.crumbs = document.querySelectorAll('.crumb');
    
    if (!this.container || !this.prevButton || !this.nextButton) {
      console.warn('Episodes Carousel elements not found');
      return;
    }

    this.episodes = Array.from(this.container.querySelectorAll('.episode_card'));
    this.currentIndex = 0;
    this.cardWidth = 0;
    this.containerWidth = 0;
    this.visibleCards = 1;
    this.maxIndex = 0;
    
    this.init();
  }

  init() {
    setTimeout(() => {
      this.calculateDimensions();
      this.setupEventListeners();
      this.updateCarousel();
    }, 200);

    // Recalculate on window resize with debouncing
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.calculateDimensions();
        this.updateCarousel();
      }, 250);
    });
  }

  calculateDimensions() {
    if (this.episodes.length === 0) return;

    // Get container width
    this.containerWidth = this.container.offsetWidth;
    
    // Get the first card's width
    const firstCard = this.episodes[0];
    this.cardWidth = firstCard.offsetWidth;
    
    // Get the gap from computed styles
    const containerStyle = window.getComputedStyle(this.container);
    const gap = parseFloat(containerStyle.gap) || 16; // fallback to 16px
    
    // Calculate how many full cards can fit in the container
    this.visibleCards = Math.floor((this.containerWidth + gap) / (this.cardWidth + gap));
    
    // Ensure we don't show more cards than we have
    this.visibleCards = Math.min(this.visibleCards, this.episodes.length);
    
    // The maximum index is where we stop to avoid empty space
    // This is the key fix: we can scroll until we show the last set of cards
    this.maxIndex = Math.max(0, this.episodes.length - this.visibleCards);
    
    // Ensure current index is valid
    this.currentIndex = Math.min(this.currentIndex, this.maxIndex);
  }

  setupEventListeners() {
    this.prevButton.addEventListener('click', () => this.goToPrevious());
    this.nextButton.addEventListener('click', () => this.goToNext());
    
    // Setup crumb navigation
    this.crumbs.forEach((crumb, index) => {
      crumb.addEventListener('click', () => {
        // Map crumb index to carousel position
        const targetIndex = Math.round((index / Math.max(1, this.crumbs.length - 1)) * this.maxIndex);
        this.goToSlide(targetIndex);
      });
      crumb.style.cursor = 'pointer';
    });

    // Add touch/swipe support
    this.addTouchSupport();
  }

  addTouchSupport() {
    let startX = 0;
    let endX = 0;
    let isDragging = false;

    this.container.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
    });

    this.container.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
    });

    this.container.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      isDragging = false;
      
      endX = e.changedTouches[0].clientX;
      const diff = startX - endX;
      
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          this.goToNext();
        } else {
          this.goToPrevious();
        }
      }
    });
  }

  updateCarousel() {
    if (!this.container || this.episodes.length === 0) return;

    // Calculate the exact translation needed
    // Move by card width + gap for each step
    const containerStyle = window.getComputedStyle(this.container);
    const gap = parseFloat(containerStyle.gap) || 16;
    const translateX = -this.currentIndex * (this.cardWidth + gap);
    
    // Apply the transform
    this.container.style.transform = `translateX(${translateX}px)`;
    this.container.style.transition = 'transform 0.3s ease';
    
    // Update UI elements
    this.updateButtonStates();
    this.updateCrumbs();
  }

  updateButtonStates() {
    // Previous button
    if (this.currentIndex <= 0) {
      this.prevButton.style.opacity = '0.5';
      this.prevButton.style.pointerEvents = 'none';
    } else {
      this.prevButton.style.opacity = '1';
      this.prevButton.style.pointerEvents = 'auto';
    }

    // Next button - key fix here
    if (this.currentIndex >= this.maxIndex) {
      this.nextButton.style.opacity = '0.5';
      this.nextButton.style.pointerEvents = 'none';
    } else {
      this.nextButton.style.opacity = '1';
      this.nextButton.style.pointerEvents = 'auto';
    }
  }

  updateCrumbs() {
    if (this.crumbs.length === 0) return;
    
    const progress = this.maxIndex > 0 ? this.currentIndex / this.maxIndex : 0;
    const activeCrumbIndex = Math.round(progress * (this.crumbs.length - 1));
    
    this.crumbs.forEach((crumb, index) => {
      crumb.classList.toggle('active', index === activeCrumbIndex);
    });
    this.episodes.forEach((episode, index) => {
      episode.classList.toggle('active', index >= this.currentIndex && index < this.currentIndex + this.visibleCards);
    });
  }

  goToPrevious() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateCarousel();
    }
  }

  goToNext() {
    if (this.currentIndex < this.maxIndex) {
      this.currentIndex++;
      this.updateCarousel();
    }
  }

  goToSlide(index) {
    const targetIndex = Math.max(0, Math.min(index, this.maxIndex));
    if (targetIndex !== this.currentIndex) {
      this.currentIndex = targetIndex;
      this.updateCarousel();
    }
  }

  // Public method to refresh carousel
  refresh() {
    this.calculateDimensions();
    this.updateCarousel();
  }
}

// Quotes Carousel Class
export class QuotesCarousel {
  constructor() {
    this.track = document.getElementById('carouselTrack');
    this.prevBtn = document.getElementById('prevBtn');
    this.nextBtn = document.getElementById('nextBtn');
    this.images = this.track?.querySelectorAll('.quote_image');
    
    if (!this.track || !this.images?.length) {
      console.warn('Quotes Carousel elements not found');
      return;
    }
    
    this.currentIndex = 0;
    this.imageWidth = 400;
    this.gap = 16; // Default gap value
    this.visibleImages = this.getVisibleImages();
    this.maxIndex = Math.max(0, this.images.length - this.visibleImages);
    
    this.init();
  }
  
  init() {
    setTimeout(() => {
      this.calculateDimensions();
      this.updateCarousel();
      this.bindEvents();
      this.handleResize();
    }, 100);
  }
  
  calculateDimensions() {
    if (!this.track || this.images.length === 0) return;
    
    // Get actual gap from styles
    const trackStyle = window.getComputedStyle(this.track);
    this.gap = parseFloat(trackStyle.gap) || 16;
    
    // Get actual image width
    const firstImage = this.images[0];
    if (firstImage) {
      this.imageWidth = firstImage.offsetWidth || 400;
    }
    
    this.visibleImages = this.getVisibleImages();
    this.maxIndex = Math.max(0, this.images.length - this.visibleImages);
    
    // Ensure current index is valid
    this.currentIndex = Math.min(this.currentIndex, this.maxIndex);
  }
  
  getVisibleImages() {
    const containerWidth = this.track.parentElement.offsetWidth;
    return Math.max(1, Math.floor((containerWidth + this.gap) / (this.imageWidth + this.gap)));
  }
  
  updateCarousel() {
    if (!this.track) return;
    
    const translateX = -this.currentIndex * (this.imageWidth + this.gap);
    this.track.style.transform = `translateX(${translateX}px)`;
    this.track.style.transition = 'transform 0.5s ease-in-out';
    
    this.updateButtons();
  }
  
  updateButtons() {
    if (!this.prevBtn || !this.nextBtn) return;
    
    // Previous button
    if (this.currentIndex <= 0) {
      this.prevBtn.disabled = true;
      this.prevBtn.style.opacity = '0.5';
    } else {
      this.prevBtn.disabled = false;
      this.prevBtn.style.opacity = '1';
    }
    
    // Next button
    if (this.currentIndex >= this.maxIndex) {
      this.nextBtn.disabled = true;
      this.nextBtn.style.opacity = '0.5';
    } else {
      this.nextBtn.disabled = false;
      this.nextBtn.style.opacity = '1';
    }
  }
  
  slide(direction) {
    if (direction === 'next' && this.currentIndex < this.maxIndex) {
      this.currentIndex++;
    } else if (direction === 'prev' && this.currentIndex > 0) {
      this.currentIndex--;
    }
    
    this.updateCarousel();
  }
  
  bindEvents() {
    this.prevBtn?.addEventListener('click', () => this.slide('prev'));
    this.nextBtn?.addEventListener('click', () => this.slide('next'));
    
    // Touch support
    let startX = 0;
    let isDragging = false;
    
    this.track.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
    });
    
    this.track.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
    });
    
    this.track.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      isDragging = false;
      
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;
      const threshold = 50;
      
      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          this.slide('next');
        } else {
          this.slide('prev');
        }
      }
    });
    
    // Keyboard navigation (only if quotes carousel is visible)
    document.addEventListener('keydown', (e) => {
      // Check if quotes section is visible/focused
      const quotesSection = document.querySelector('.quotes');
      if (!quotesSection) return;
      
      if (e.key === 'ArrowLeft') {
        this.slide('prev');
      } else if (e.key === 'ArrowRight') {
        this.slide('next');
      }
    });
  }
  
  handleResize() {
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.calculateDimensions();
        this.updateCarousel();
      }, 250);
    });
  }
  
  // Public method to refresh carousel
  refresh() {
    this.calculateDimensions();
    this.updateCarousel();
  }
}

// Carousel Manager - Handles initialization of both carousels
class CarouselManager {
  constructor() {
    this.episodesCarousel = null;
    this.quotesCarousel = null;
    this.initialized = false;
  }
  
  init() {
    if (this.initialized) return;
    
    // Initialize Episodes Carousel
    const episodesContainer = document.querySelector('.recenteps_episodes');
    const episodesPrevBtn = document.querySelector('.recenteps .nav_button.prev');
    const episodesNextBtn = document.querySelector('.recenteps .nav_button.next');
    
    if (episodesContainer && episodesPrevBtn && episodesNextBtn) {
      this.episodesCarousel = new EpisodesCarousel();
    }
    
    // Initialize Quotes Carousel
    const quotesTrack = document.getElementById('carouselTrack');
    const quotesPrevBtn = document.getElementById('prevBtn');
    const quotesNextBtn = document.getElementById('nextBtn');
    
    if (quotesTrack && quotesPrevBtn && quotesNextBtn) {
      this.quotesCarousel = new QuotesCarousel();
    }
    
    this.initialized = true;
  }
  
  refresh() {
    this.episodesCarousel?.refresh();
    this.quotesCarousel?.refresh();
  }
}

// Export functions for manual initialization
export function initializeEpisodesCarousel() {
  return new EpisodesCarousel();
}

export function initializeQuotesCarousel() {
  return new QuotesCarousel();
}

export function initializeAllCarousels() {
  const manager = new CarouselManager();
  manager.init();
  return manager;
}

// Auto-initialize when imported (only in browser environment)
if (typeof window !== 'undefined') {
  const manager = new CarouselManager();
  
  const autoInit = () => {
    try {
      manager.init();
    } catch (error) {
      console.warn('Carousel auto-initialization failed:', error);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    // Use setTimeout to ensure DOM elements are available
    setTimeout(autoInit, 100);
  }
  
  // Expose manager globally for debugging
  window.carouselManager = manager;
}