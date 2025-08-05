// Company Splash Screen Animation
class SplashScreen {
    constructor() {
        this.splashElement = null;
        this.isAnimating = false;
        this.init();
    }

    init() {
        // Only show splash on index.html or root page
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            this.createSplashScreen();
            this.adjustSplashSize();
            this.startSplashAnimation();
            
            // Listen for window resize events
            window.addEventListener('resize', () => {
                this.adjustSplashSize();
            });
        }
    }

    createSplashScreen() {
        this.splashElement = document.createElement('div');
        this.splashElement.className = 'splash-screen';
        this.splashElement.innerHTML = `
            <div class="splash-content">
                <div class="logo-container">
                    <div class="logo-icon">
                        <i class="bi bi-wallet2"></i>
                    </div>
                    <div class="logo-text">
                        <h1 class="company-name">FinanceHub</h1>
                        <p class="company-tagline">Empowering Financial Excellence</p>
                    </div>
                </div>
                <div class="loading-section">
                    <div class="loading-bar-container">
                        <div class="loading-bar">
                            <div class="loading-progress"></div>
                        </div>
                        <div class="loading-text">Loading your dashboard...</div>
                    </div>
                    <div class="loading-stats">
                        <div class="stat-item">
                            <span class="stat-label">Charts</span>
                            <span class="stat-value">Initializing...</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Metrics</span>
                            <span class="stat-value">Processing...</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Data</span>
                            <span class="stat-value">Loading...</span>
                        </div>
                    </div>
                </div>
                <div class="version-info">
                    <span>v2.1.0</span>
                </div>
            </div>
            <div class="floating-particles">
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
            </div>
        `;
        document.body.appendChild(this.splashElement);
    }

    adjustSplashSize() {
        if (!this.splashElement) return;
        
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const splashContent = this.splashElement.querySelector('.splash-content');
        
        // Calculate optimal scale based on viewport
        const contentHeight = splashContent.scrollHeight;
        const contentWidth = splashContent.scrollWidth;
        
        // Calculate scale factors for both dimensions
        const scaleY = (viewportHeight * 0.8) / contentHeight;
        const scaleX = (viewportWidth * 0.8) / contentWidth;
        
        // Use the smaller scale to ensure it fits in both dimensions
        const optimalScale = Math.min(scaleY, scaleX, 1);
        
        // Apply the scale
        splashContent.style.transform = `scale(${optimalScale})`;
        
        // Adjust for very small screens
        if (viewportHeight < 400) {
            splashContent.style.transform = `scale(${Math.min(optimalScale, 0.7)})`;
        }
        
        if (viewportWidth < 480) {
            splashContent.style.transform = `scale(${Math.min(optimalScale, 0.8)})`;
        }
    }

    async startSplashAnimation() {
        this.isAnimating = true;
        
        // Hide main content initially
        const mainContent = document.querySelector('.container-fluid');
        if (mainContent) {
            mainContent.style.opacity = '0';
        }

        // Start splash animation sequence with logo first, then loading
        await this.animateLogo();
        await this.animateCompanyName();
        await this.animateTagline();
        await this.animateLoadingSection();
        await this.wait(800); // Reduced show time
        
        // Fade out splash and show main content
        await this.fadeOutSplash();
        
        this.isAnimating = false;
    }

    async animateLogo() {
        const logoIcon = this.splashElement.querySelector('.logo-icon i');
        const logoContainer = this.splashElement.querySelector('.logo-container');
        
        // Start with logo hidden
        logoContainer.style.opacity = '0';
        logoContainer.style.transform = 'translateY(20px) scale(0.9)';
        
        // Animate logo in with smoother easing
        await this.wait(300);
        logoContainer.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        logoContainer.style.opacity = '1';
        logoContainer.style.transform = 'translateY(0) scale(1)';
        
        // Add gentle pulse animation to icon
        logoIcon.style.animation = 'logoPulse 3s ease-in-out infinite';
        
        await this.wait(800);
    }

    async animateCompanyName() {
        const companyName = this.splashElement.querySelector('.company-name');
        
        // Start with text hidden
        companyName.style.opacity = '0';
        companyName.style.transform = 'translateX(-15px)';
        
        // Animate text in with smoother timing
        await this.wait(200);
        companyName.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        companyName.style.opacity = '1';
        companyName.style.transform = 'translateX(0)';
        
        // Add letter-by-letter animation with faster timing
        const text = companyName.textContent;
        companyName.innerHTML = '';
        
        for (let i = 0; i < text.length; i++) {
            const letter = document.createElement('span');
            letter.textContent = text[i];
            letter.style.opacity = '0';
            letter.style.transform = 'translateY(10px)';
            letter.style.transition = `all 0.2s ease-out ${i * 0.05}s`;
            companyName.appendChild(letter);
            
            setTimeout(() => {
                letter.style.opacity = '1';
                letter.style.transform = 'translateY(0)';
            }, 50);
        }
        
        await this.wait(600);
    }

    async animateTagline() {
        const tagline = this.splashElement.querySelector('.company-tagline');
        
        // Start with tagline hidden
        tagline.style.opacity = '0';
        tagline.style.transform = 'translateX(15px)';
        
        // Animate tagline in with smoother easing
        await this.wait(150);
        tagline.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        tagline.style.opacity = '1';
        tagline.style.transform = 'translateX(0)';
        
        await this.wait(500);
    }

    async animateLoadingSection() {
        const loadingSection = this.splashElement.querySelector('.loading-section');
        const progressBar = this.splashElement.querySelector('.loading-progress');
        const loadingText = this.splashElement.querySelector('.loading-text');
        const statValues = this.splashElement.querySelectorAll('.stat-value');
        
        // Start with loading section hidden
        loadingSection.style.opacity = '0';
        loadingSection.style.transform = 'translateY(20px)';
        
        // Animate loading section in
        await this.wait(200);
        loadingSection.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        loadingSection.style.opacity = '1';
        loadingSection.style.transform = 'translateY(0)';
        
        await this.wait(300);
        
        // Animate progress bar
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 12 + 3; // More realistic progress
            if (progress > 100) progress = 100;
            progressBar.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(progressInterval);
                setTimeout(() => {
                    statValues[0].textContent = '✓ Ready';
                    statValues[1].textContent = '✓ Ready';
                    statValues[2].textContent = '✓ Ready';
                    loadingText.textContent = 'Dashboard ready!';
                }, 200);
            }
        }, 100);

        // Animate stat values with changing text
        const loadingTexts = ['Initializing...', 'Processing...', 'Finalizing...'];
        statValues.forEach((value, index) => {
            let textIndex = 0;
            const textInterval = setInterval(() => {
                value.textContent = loadingTexts[textIndex];
                textIndex = (textIndex + 1) % loadingTexts.length;
                
                if (progress >= 100) {
                    clearInterval(textInterval);
                }
            }, 400);
        });
        
        await this.wait(1200);
    }

    async fadeOutSplash() {
        // Fade out splash screen with smoother easing
        this.splashElement.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        this.splashElement.style.opacity = '0';
        this.splashElement.style.transform = 'scale(0.98)';
        
        // Show main content with smoother transition
        const mainContent = document.querySelector('.container-fluid');
        if (mainContent) {
            mainContent.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            mainContent.style.opacity = '1';
        }
        
        await this.wait(600);
        
        // Remove splash element
        if (this.splashElement.parentNode) {
            this.splashElement.parentNode.removeChild(this.splashElement);
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize splash screen when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SplashScreen();
}); 