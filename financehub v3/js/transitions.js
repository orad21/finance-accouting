// Page Transition Handler
class PageTransition {
    constructor() {
        this.transitionElement = null;
        this.isTransitioning = false;
        this.init();
    }

    init() {
        // Create transition overlay
        this.createTransitionOverlay();
        
        // Add navigation event listeners
        this.addNavigationListeners();
        
        // Add content fade-in animation on page load
        this.addContentAnimations();
        
        // Add page load animation
        this.addPageLoadAnimation();
    }

    createTransitionOverlay() {
        this.transitionElement = document.createElement('div');
        this.transitionElement.className = 'page-transition';
        this.transitionElement.innerHTML = `
            <div class="transition-content">
                <i class="bi bi-arrow-right-circle"></i>
                <h3>Loading...</h3>
                <p>Please wait while we navigate to your destination</p>
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        document.body.appendChild(this.transitionElement);
    }

    addNavigationListeners() {
        // Add click listeners to all navigation buttons with data-page attribute
        const navButtons = document.querySelectorAll('.nav-btn[data-page]');
        
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = button.getAttribute('data-page');
                const pageName = this.getPageNameFromHref(targetPage);
                
                // Check if navigating to dashboard for special animation
                if (targetPage === 'index.html') {
                    this.navigateToDashboard(targetPage, pageName, e);
                } else {
                    this.navigateToPage(targetPage, pageName, e);
                }
            });
        });

        // Add click listeners to non-functional buttons (without data-page)
        const nonFunctionalButtons = document.querySelectorAll('.nav-btn:not([data-page])');
        nonFunctionalButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                // Add visual feedback for non-functional buttons
                this.showNonFunctionalFeedback(button, e);
            });
        });

        // Also handle direct links
        this.handleDirectLinks();
    }

    handleDirectLinks() {
        // Handle any direct navigation links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && (link.href.includes('index.html') || 
                        link.href.includes('accounts-receivable.html') || 
                        link.href.includes('accounts-payable.html'))) {
                e.preventDefault();
                const href = link.getAttribute('href');
                const pageName = this.getPageNameFromHref(href);
                
                if (href.includes('index.html')) {
                    this.navigateToDashboard(href, pageName, e);
                } else {
                    this.navigateToPage(href, pageName, e);
                }
            }
        });
    }

    getPageNameFromHref(href) {
        if (href.includes('index.html')) return 'Dashboard';
        if (href.includes('accounts-receivable.html')) return 'Accounts Receivable';
        if (href.includes('accounts-payable.html')) return 'Accounts Payable';
        return 'Page';
    }

    async navigateToDashboard(url, pageName, e) {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        
        // Create special dashboard transition
        this.createDashboardTransition(pageName);
        
        // Add hover effect to clicked button
        const clickedButton = e.target.closest('.nav-btn');
        if (clickedButton) {
            clickedButton.style.transform = 'translateX(10px) scale(1.05)';
        }
        
        // Start dashboard transition
        this.transitionElement.classList.add('active', 'dashboard-transition');
        
        // Add fade-out animation to current content
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.classList.add('content-fade-out');
        }
        
        // Add dashboard-specific loading animation
        this.startDashboardLoadingAnimation();
        
        // Wait for transition animation
        await this.wait(1200);
        
        // Navigate to dashboard
        window.location.href = url;
    }

    async navigateToPage(url, pageName, e) {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        
        // Update transition content
        this.updateTransitionContent(pageName);
        
        // Add hover effect to clicked button
        const clickedButton = e.target.closest('.nav-btn');
        if (clickedButton) {
            clickedButton.style.transform = 'translateX(10px) scale(1.05)';
        }
        
        // Start transition
        this.transitionElement.classList.add('active');
        
        // Add fade-out animation to current content
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.classList.add('content-fade-out');
        }
        
        // Add loading animation
        this.startLoadingAnimation();
        
        // Wait for transition animation
        await this.wait(800);
        
        // Navigate to new page
        window.location.href = url;
    }

    createDashboardTransition(pageName) {
        // Update transition content for dashboard
        const icon = this.transitionElement.querySelector('i');
        const title = this.transitionElement.querySelector('h3');
        const description = this.transitionElement.querySelector('p');
        
        icon.className = 'bi bi-grid';
        title.textContent = `Welcome to ${pageName}`;
        description.textContent = 'Loading your financial overview...';
        
        // Add dashboard-specific elements
        this.transitionElement.innerHTML = `
            <div class="transition-content dashboard-content">
                <div class="dashboard-icon">
                    <i class="bi bi-grid"></i>
                </div>
                <h3>Welcome to Dashboard</h3>
                <p>Loading your financial overview...</p>
                <div class="dashboard-loading">
                    <div class="loading-bar">
                        <div class="loading-progress"></div>
                    </div>
                    <div class="loading-stats">
                        <div class="stat-item">
                            <span class="stat-label">Charts</span>
                            <span class="stat-value">Loading...</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Metrics</span>
                            <span class="stat-value">Loading...</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Data</span>
                            <span class="stat-value">Loading...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    startDashboardLoadingAnimation() {
        const progressBar = this.transitionElement.querySelector('.loading-progress');
        const statValues = this.transitionElement.querySelectorAll('.stat-value');
        
        // Animate progress bar
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 100) progress = 100;
            progressBar.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(progressInterval);
                setTimeout(() => {
                    statValues[0].textContent = '✓ Ready';
                    statValues[1].textContent = '✓ Ready';
                    statValues[2].textContent = '✓ Ready';
                }, 200);
            }
        }, 100);

        // Animate stat values
        const loadingTexts = ['Initializing...', 'Processing...', 'Finalizing...'];
        statValues.forEach((value, index) => {
            let textIndex = 0;
            const textInterval = setInterval(() => {
                value.textContent = loadingTexts[textIndex];
                textIndex = (textIndex + 1) % loadingTexts.length;
                
                if (progress >= 100) {
                    clearInterval(textInterval);
                }
            }, 300);
        });
    }

    updateTransitionContent(pageName) {
        const icon = this.transitionElement.querySelector('i');
        const title = this.transitionElement.querySelector('h3');
        const description = this.transitionElement.querySelector('p');
        
        // Update icon based on page
        if (pageName.includes('Dashboard')) {
            icon.className = 'bi bi-grid';
        } else if (pageName.includes('Receivable')) {
            icon.className = 'bi bi-arrow-down-circle';
        } else if (pageName.includes('Payable')) {
            icon.className = 'bi bi-arrow-up-circle';
        }
        
        title.textContent = `Navigating to ${pageName}`;
        description.textContent = 'Please wait while we load your data...';
    }

    startLoadingAnimation() {
        const dots = this.transitionElement.querySelectorAll('.loading-dots span');
        dots.forEach((dot, index) => {
            dot.style.animationDelay = `${index * 0.2}s`;
        });
    }

    addContentAnimations() {
        // Add fade-in animation to main content
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.classList.add('content-fade-in');
        }
        
        // Add staggered animations to cards
        const cards = document.querySelectorAll('.metrics-card, .chart-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${(index + 1) * 0.1}s`;
        });
    }

    addPageLoadAnimation() {
        // Add entrance animation to the entire page
        document.body.style.opacity = '0';
        document.body.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            document.body.style.transition = 'all 0.8s ease-out';
            document.body.style.opacity = '1';
            document.body.style.transform = 'translateY(0)';
        }, 100);
    }

    showNonFunctionalFeedback(button, e) {
        // Add visual feedback for non-functional buttons
        const originalTransform = button.style.transform;
        const originalBackground = button.style.backgroundColor;
        
        // Add hover effect to clicked button
        button.style.transform = 'translateX(10px) scale(1.05)';
        button.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
        
        // Reset after animation
        setTimeout(() => {
            button.style.transform = originalTransform;
            button.style.backgroundColor = originalBackground;
        }, 300);
        
        // Optional: Show a subtle notification
        this.showComingSoonNotification(button);
    }
    
    showComingSoonNotification(button) {
        // Create a subtle "Coming Soon" notification
        const notification = document.createElement('div');
        notification.className = 'coming-soon-notification';
        notification.textContent = 'Coming Soon';
        notification.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        // Position the notification near the button
        const rect = button.getBoundingClientRect();
        notification.style.left = rect.left + 'px';
        notification.style.top = (rect.bottom + 5) + 'px';
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // Hide notification after 2 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize page transitions when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PageTransition();
});

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
    // Add a brief transition for browser navigation
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.classList.add('content-fade-in');
    }
});

// Add smooth scrolling for better UX
document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll to top when navigating
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}); 