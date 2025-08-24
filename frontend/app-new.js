// CampX Frontend Application
class CampXApp {
    constructor() {
        this.api = new CampXAPI();
        this.auth = new AuthManager();
        this.components = new ComponentManager();
        this.socket = null;
        this.currentUser = null;
        this.currentSection = 'home';
        
        this.init();
    }

    async init() {
        this.initNavigation();
        this.initTheme();
        this.initMobileMenu();
        this.initSearch();
        this.initAuth();
        
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (token) {
            try {
                this.currentUser = await this.api.getCurrentUser();
                this.updateUIForLoggedInUser();
                this.initSocket();
            } catch (error) {
                localStorage.removeItem('token');
            }
        }
        
        // Load initial content
        this.showSection('home');
        this.loadProducts();
    }

    initNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
            });
        });

        // Hero buttons
        const heroExploreBtn = document.getElementById('heroExploreBtn');
        const heroSellBtn = document.getElementById('heroSellBtn');
        
        if (heroExploreBtn) {
            heroExploreBtn.addEventListener('click', () => this.showSection('discover'));
        }
        
        if (heroSellBtn) {
            heroSellBtn.addEventListener('click', () => this.showSection('sell'));
        }
    }

    initTheme() {
        const themeToggle = document.getElementById('themeToggle');
        const savedTheme = localStorage.getItem('theme') || 'light';
        
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
        
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            this.updateThemeIcon(newTheme);
        });
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('#themeToggle i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    initMobileMenu() {
        const mobileToggle = document.getElementById('mobileMenuToggle');
        const navMenu = document.getElementById('navMenu');
        
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        });
    }

    initSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        const performSearch = async () => {
            const query = searchInput.value.trim();
            if (!query) return;
            
            this.showSection('discover');
            await this.searchProducts(query);
        };
        
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    initAuth() {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        
        loginBtn.addEventListener('click', () => this.auth.showLoginModal());
        registerBtn.addEventListener('click', () => this.auth.showRegisterModal());
        
        // Listen for auth events
        this.auth.on('login', (user) => {
            this.currentUser = user;
            this.updateUIForLoggedInUser();
            this.initSocket();
        });
        
        this.auth.on('logout', () => {
            this.currentUser = null;
            this.updateUIForLoggedOutUser();
            if (this.socket) {
                this.socket.disconnect();
                this.socket = null;
            }
        });
    }

    updateUIForLoggedInUser() {
        const authButtons = document.querySelector('.auth-buttons');
        const userMenu = document.querySelector('.user-menu');
        
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';
        
        const userAvatar = document.getElementById('userAvatar');
        const initials = this.currentUser.username.substring(0, 2).toUpperCase();
        userAvatar.innerHTML = `<span>${initials}</span>`;
    }

    updateUIForLoggedOutUser() {
        const authButtons = document.querySelector('.auth-buttons');
        const userMenu = document.querySelector('.user-menu');
        
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
    }

    initSocket() {
        if (!this.currentUser) return;
        
        this.socket = io('http://localhost:3000', {
            auth: {
                token: localStorage.getItem('token')
            }
        });
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
        });
        
        this.socket.on('new_message', (message) => {
            this.handleNewMessage(message);
        });
    }

    showSection(sectionId) {
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
        
        // Update active section
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');
        
        this.currentSection = sectionId;
        
        // Load section-specific content
        switch (sectionId) {
            case 'discover':
                this.loadProducts();
                break;
            case 'sell':
                this.loadSellForm();
                break;
            case 'chats':
                this.loadChats();
                break;
            case 'profile':
                this.loadProfile();
                break;
        }
    }

    async loadProducts() {
        try {
            const products = await this.api.getItems();
            this.displayProducts(products);
        } catch (error) {
            console.error('Error loading products:', error);
            this.components.showToast('Error loading products', 'error');
        }
    }

    displayProducts(products) {
        const grid = document.getElementById('productsGrid');
        
        if (!products || products.length === 0) {
            grid.innerHTML = '<div class="empty-state">No items found. Be the first to sell something!</div>';
            return;
        }
        
        grid.innerHTML = products.map(product => this.components.createProductCard(product)).join('');
        
        // Add click handlers to product cards
        grid.querySelectorAll('.product-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.showProductDetails(products[index]);
            });
        });
    }

    async searchProducts(query) {
        try {
            this.components.showLoading('productsGrid');
            
            const results = await this.api.searchItems(query);
            this.displayProducts(results);
            
            // Show search results header
            const header = document.querySelector('#discover .section-header');
            header.innerHTML = `
                <h2>Search Results</h2>
                <p>Found ${results.length} items for "${query}"</p>
                <button class="btn btn-outline" onclick="app.loadProducts()">
                    <i class="fas fa-arrow-left"></i> Back to all items
                </button>
            `;
        } catch (error) {
            console.error('Error searching products:', error);
            this.components.showToast('Error searching products', 'error');
        }
    }

    loadSellForm() {
        const container = document.querySelector('#sell .sell-container');
        
        if (!this.currentUser) {
            container.innerHTML = `
                <div class="auth-required">
                    <i class="fas fa-user-lock"></i>
                    <h3>Login Required</h3>
                    <p>Please login to start selling items</p>
                    <button class="btn btn-primary" onclick="app.auth.showLoginModal()">Login</button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="sell-form-container">
                <form class="sell-form" id="sellForm">
                    <div class="form-group">
                        <label for="itemImages">Upload Images</label>
                        <div class="image-upload-area" id="imageUploadArea">
                            <i class="fas fa-camera"></i>
                            <p>Click to upload or drag & drop images</p>
                            <input type="file" id="itemImages" multiple accept="image/*" style="display: none;">
                        </div>
                        <div class="uploaded-images" id="uploadedImages"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="itemTitle">Title</label>
                        <input type="text" id="itemTitle" placeholder="e.g., iPhone 13 Pro Max" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="itemDescription">Description</label>
                        <textarea id="itemDescription" placeholder="AI will help enhance this..." rows="4"></textarea>
                        <button type="button" class="btn btn-outline ai-enhance-btn" id="aiEnhanceBtn">
                            <i class="fas fa-magic"></i> Enhance with AI
                        </button>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="itemPrice">Price ($)</label>
                            <input type="number" id="itemPrice" step="0.01" placeholder="0.00" required>
                            <button type="button" class="btn btn-outline ai-price-btn" id="aiPriceBtn">
                                <i class="fas fa-brain"></i> AI Price Suggestion
                            </button>
                        </div>
                        
                        <div class="form-group">
                            <label for="itemCategory">Category</label>
                            <select id="itemCategory" required>
                                <option value="">Select category</option>
                                <option value="electronics">Electronics</option>
                                <option value="books">Books</option>
                                <option value="clothing">Clothing</option>
                                <option value="furniture">Furniture</option>
                                <option value="sports">Sports & Recreation</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="itemCondition">Condition</label>
                        <select id="itemCondition" required>
                            <option value="">Select condition</option>
                            <option value="new">New</option>
                            <option value="like-new">Like New</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor</option>
                        </select>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-large">
                        <i class="fas fa-plus"></i> List Item
                    </button>
                </form>
            </div>
        `;
        
        this.initSellForm();
    }

    initSellForm() {
        const form = document.getElementById('sellForm');
        const imageUploadArea = document.getElementById('imageUploadArea');
        const imageInput = document.getElementById('itemImages');
        const aiEnhanceBtn = document.getElementById('aiEnhanceBtn');
        const aiPriceBtn = document.getElementById('aiPriceBtn');
        
        // Image upload handling
        imageUploadArea.addEventListener('click', () => imageInput.click());
        imageInput.addEventListener('change', this.handleImageUpload.bind(this));
        
        // AI enhancement
        aiEnhanceBtn.addEventListener('click', this.enhanceDescriptionWithAI.bind(this));
        aiPriceBtn.addEventListener('click', this.suggestPriceWithAI.bind(this));
        
        // Form submission
        form.addEventListener('submit', this.handleSellFormSubmit.bind(this));
    }

    async handleImageUpload(event) {
        const files = Array.from(event.target.files);
        const uploadedImagesContainer = document.getElementById('uploadedImages');
        
        for (const file of files) {
            const imagePreview = document.createElement('div');
            imagePreview.className = 'image-preview';
            imagePreview.innerHTML = `
                <img src="${URL.createObjectURL(file)}" alt="Preview">
                <button type="button" class="remove-image" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;
            uploadedImagesContainer.appendChild(imagePreview);
        }
        
        // Trigger AI analysis if images are uploaded
        if (files.length > 0) {
            this.analyzeImagesWithAI(files);
        }
    }

    async analyzeImagesWithAI(files) {
        try {
            const formData = new FormData();
            files.forEach(file => formData.append('images', file));
            
            const analysis = await this.api.analyzeImages(formData);
            
            if (analysis.suggestions) {
                const titleInput = document.getElementById('itemTitle');
                const descInput = document.getElementById('itemDescription');
                const categorySelect = document.getElementById('itemCategory');
                
                if (!titleInput.value && analysis.suggestions.title) {
                    titleInput.value = analysis.suggestions.title;
                }
                
                if (!descInput.value && analysis.suggestions.description) {
                    descInput.value = analysis.suggestions.description;
                }
                
                if (analysis.suggestions.category) {
                    categorySelect.value = analysis.suggestions.category;
                }
                
                this.components.showToast('AI analysis complete! Fields auto-filled.', 'success');
            }
        } catch (error) {
            console.error('Error analyzing images:', error);
        }
    }

    loadChats() {
        const container = document.querySelector('#chats .chats-container');
        
        if (!this.currentUser) {
            container.innerHTML = `
                <div class="auth-required">
                    <i class="fas fa-user-lock"></i>
                    <h3>Login Required</h3>
                    <p>Please login to view your chats</p>
                    <button class="btn btn-primary" onclick="app.auth.showLoginModal()">Login</button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="chats-list">
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <h3>No chats yet</h3>
                    <p>Start a conversation by messaging a seller</p>
                </div>
            </div>
        `;
    }

    loadProfile() {
        const container = document.querySelector('#profile .profile-container');
        
        if (!this.currentUser) {
            container.innerHTML = `
                <div class="auth-required">
                    <i class="fas fa-user-lock"></i>
                    <h3>Login Required</h3>
                    <p>Please login to view your profile</p>
                    <button class="btn btn-primary" onclick="app.auth.showLoginModal()">Login</button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="profile-content">
                <div class="profile-header">
                    <div class="profile-avatar">
                        <span>${this.currentUser.username.substring(0, 2).toUpperCase()}</span>
                    </div>
                    <div class="profile-info">
                        <h3>${this.currentUser.username}</h3>
                        <p>${this.currentUser.email}</p>
                        <p class="member-since">Member since ${new Date(this.currentUser.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button class="btn btn-outline" onclick="app.auth.logout()">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
                
                <div class="profile-stats">
                    <div class="stat">
                        <span class="stat-number">0</span>
                        <span class="stat-label">Items Listed</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">0</span>
                        <span class="stat-label">Items Sold</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">0</span>
                        <span class="stat-label">Reviews</span>
                    </div>
                </div>
            </div>
        `;
    }

    handleNewMessage(message) {
        // Handle new chat messages
        this.components.showToast(`New message from ${message.sender.username}`, 'info');
    }

    showProductDetails(product) {
        // Show product detail modal
        this.components.showProductModal(product);
    }

    async enhanceDescriptionWithAI() {
        const titleInput = document.getElementById('itemTitle');
        const descInput = document.getElementById('itemDescription');
        const categorySelect = document.getElementById('itemCategory');
        
        if (!titleInput.value) {
            this.components.showToast('Please enter a title first', 'warning');
            return;
        }
        
        try {
            const enhancement = await this.api.enhanceDescription({
                title: titleInput.value,
                description: descInput.value,
                category: categorySelect.value
            });
            
            if (enhancement.enhancedDescription) {
                descInput.value = enhancement.enhancedDescription;
                this.components.showToast('Description enhanced with AI!', 'success');
            }
        } catch (error) {
            console.error('Error enhancing description:', error);
            this.components.showToast('Failed to enhance description', 'error');
        }
    }

    async suggestPriceWithAI() {
        const titleInput = document.getElementById('itemTitle');
        const categorySelect = document.getElementById('itemCategory');
        const conditionSelect = document.getElementById('itemCondition');
        const priceInput = document.getElementById('itemPrice');
        
        if (!titleInput.value || !categorySelect.value) {
            this.components.showToast('Please fill in title and category first', 'warning');
            return;
        }
        
        try {
            const suggestion = await this.api.suggestPrice({
                title: titleInput.value,
                category: categorySelect.value,
                condition: conditionSelect.value
            });
            
            if (suggestion.suggestedPrice) {
                priceInput.value = suggestion.suggestedPrice;
                this.components.showToast(`AI suggests: $${suggestion.suggestedPrice}`, 'success');
            }
        } catch (error) {
            console.error('Error getting price suggestion:', error);
            this.components.showToast('Failed to get price suggestion', 'error');
        }
    }

    async handleSellFormSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const imageFiles = Array.from(document.getElementById('itemImages').files);
        
        try {
            this.components.showLoading('sellForm');
            
            // Upload images first if any
            let imageUrls = [];
            if (imageFiles.length > 0) {
                const uploadFormData = new FormData();
                imageFiles.forEach(file => uploadFormData.append('images', file));
                const uploadResult = await this.api.uploadImages(uploadFormData);
                imageUrls = uploadResult.imageUrls;
            }
            
            // Create item
            const itemData = {
                title: formData.get('title'),
                description: formData.get('description'),
                price: parseFloat(formData.get('price')),
                category: formData.get('category'),
                condition: formData.get('condition'),
                images: imageUrls
            };
            
            await this.api.createItem(itemData);
            
            this.components.showToast('Item listed successfully!', 'success');
            this.showSection('discover');
            
        } catch (error) {
            console.error('Error creating item:', error);
            this.components.showToast('Failed to list item', 'error');
        }
    }
}

// Initialize the application
const app = new CampXApp();

// Make app globally available for debugging
window.app = app;
