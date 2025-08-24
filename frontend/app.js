// Application Data
const appData = {
  "products": [
    {
      "id": 1,
      "title": "MacBook Pro M2 13-inch",
      "price": 95000,
      "originalPrice": 120000,
      "category": "Laptops",
      "seller": "Sarah Chen",
      "sellerRating": 4.8,
      "sellerAvatar": "SC",
      "location": "VIT Pune",
      "condition": "Excellent",
      "images": ["laptop1.jpg"],
      "description": "Barely used MacBook Pro with M2 chip. Perfect for computer science students. Includes original charger and box.",
      "tags": ["Programming", "Design", "Portable"],
      "datePosted": "2025-08-10",
      "status": "Available",
      "verified": true,
      "views": 247,
      "saves": 23
    },
    {
      "id": 2,
      "title": "Complete Arduino Starter Kit",
      "price": 1200,
      "category": "Electronics",
      "seller": "Raj Patel",
      "sellerRating": 4.9,
      "sellerAvatar": "RP",
      "location": "IIT Mumbai",
      "condition": "New",
      "images": ["arduino1.jpg"],
      "description": "Brand new Arduino Uno with breadboard, sensors, and 100+ components. Perfect for IoT projects.",
      "tags": ["IoT", "Projects", "Sensors"],
      "datePosted": "2025-08-09",
      "status": "Available",
      "verified": true,
      "views": 156,
      "saves": 31
    },
    {
      "id": 3,
      "title": "Data Structures & Algorithms Book",
      "price": 450,
      "originalPrice": 750,
      "category": "Textbooks",
      "seller": "Priya Sharma",
      "sellerRating": 4.7,
      "sellerAvatar": "PS",
      "location": "BITS Pilani",
      "condition": "Good",
      "images": ["book1.jpg"],
      "description": "Classic Cormen textbook with minimal highlighting. Essential for CS students.",
      "tags": ["Computer Science", "Algorithms", "Study"],
      "datePosted": "2025-08-08",
      "status": "Reserved",
      "verified": true,
      "views": 89,
      "saves": 12
    },
    {
      "id": 4,
      "title": "Sony WH-1000XM4 Headphones",
      "price": 18000,
      "originalPrice": 25000,
      "category": "Audio",
      "seller": "Mike Johnson",
      "sellerRating": 4.6,
      "sellerAvatar": "MJ",
      "location": "DU North Campus",
      "condition": "Excellent",
      "images": ["headphones1.jpg"],
      "description": "Premium noise-cancelling headphones. Perfect for studying in noisy environments.",
      "tags": ["Music", "Study", "Wireless"],
      "datePosted": "2025-08-07",
      "status": "Available",
      "verified": false,
      "views": 198,
      "saves": 45
    },
    {
      "id": 5,
      "title": "Study Desk with Drawers",
      "price": 3500,
      "category": "Furniture",
      "seller": "Ananya Gupta",
      "sellerRating": 4.8,
      "sellerAvatar": "AG",
      "location": "Manipal University",
      "condition": "Good",
      "images": ["desk1.jpg"],
      "description": "Spacious study desk with 3 drawers. Perfect for dorm rooms. Pickup only.",
      "tags": ["Study", "Storage", "Dorm"],
      "datePosted": "2025-08-06",
      "status": "Available",
      "verified": true,
      "views": 134,
      "saves": 18
    },
    {
      "id": 6,
      "title": "iPad Air with Apple Pencil",
      "price": 42000,
      "originalPrice": 55000,
      "category": "Tablets",
      "seller": "Kevin Lee",
      "sellerRating": 4.9,
      "sellerAvatar": "KL",
      "location": "NIT Trichy",
      "condition": "Excellent",
      "images": ["ipad1.jpg"],
      "description": "iPad Air 4th gen with Apple Pencil 2nd gen. Great for digital note-taking and design.",
      "tags": ["Notes", "Design", "Apple"],
      "datePosted": "2025-08-05",
      "status": "Sold",
      "verified": true,
      "views": 312,
      "saves": 67
    },
    {
      "id": 7,
      "title": "Single Room in Girls PG",
      "price": 8000,
      "category": "Accommodation",
      "seller": "Hostel Manager",
      "sellerRating": 4.5,
      "sellerAvatar": "HM",
      "location": "Pune University",
      "condition": "New",
      "images": ["room1.jpg"],
      "description": "Single occupancy room with Wi-Fi, mess facility, and 24/7 security. Monthly rent.",
      "tags": ["PG", "Girls", "WiFi"],
      "datePosted": "2025-08-04",
      "status": "Available",
      "verified": true,
      "views": 234,
      "saves": 29
    },
    {
      "id": 8,
      "title": "JEE Advanced Physics Notes",
      "price": 300,
      "category": "Notes",
      "seller": "Rohit Kumar",
      "sellerRating": 4.7,
      "sellerAvatar": "RK",
      "location": "Kota, Rajasthan",
      "condition": "Excellent",
      "images": ["notes1.jpg"],
      "description": "Complete handwritten physics notes from Allen coaching. Helped me crack JEE Advanced.",
      "tags": ["JEE", "Physics", "Coaching"],
      "datePosted": "2025-08-03",
      "status": "Available",
      "verified": true,
      "views": 167,
      "saves": 34
    },
    {
      "id": 9,
      "title": "Gaming Chair - Ergonomic",
      "price": 12000,
      "originalPrice": 18000,
      "category": "Furniture",
      "seller": "Arjun Singh",
      "sellerRating": 4.4,
      "sellerAvatar": "AS",
      "location": "IIIT Hyderabad",
      "condition": "Good",
      "images": ["chair1.jpg"],
      "description": "Comfortable gaming chair with lumbar support. Perfect for long coding sessions.",
      "tags": ["Gaming", "Ergonomic", "Comfort"],
      "datePosted": "2025-08-02",
      "status": "Available",
      "verified": false,
      "views": 198,
      "saves": 22
    },
    {
      "id": 10,
      "title": "Scientific Calculator Casio",
      "price": 800,
      "originalPrice": 1200,
      "category": "Stationery",
      "seller": "Neha Reddy",
      "sellerRating": 4.6,
      "sellerAvatar": "NR",
      "location": "VIT Chennai",
      "condition": "Excellent",
      "images": ["calculator1.jpg"],
      "description": "Casio fx-991ES Plus calculator. Essential for engineering students. Barely used.",
      "tags": ["Calculator", "Engineering", "Math"],
      "datePosted": "2025-08-01",
      "status": "Available",
      "verified": true,
      "views": 145,
      "saves": 19
    }
  ],
  "categories": [
    {
      "id": 1,
      "name": "Laptops",
      "icon": "💻",
      "color": "#3b82f6",
      "count": 45
    },
    {
      "id": 2,
      "name": "Electronics",
      "icon": "🔌",
      "color": "#10b981",
      "count": 123
    },
    {
      "id": 3,
      "name": "Textbooks",
      "icon": "📚",
      "color": "#f59e0b",
      "count": 234
    },
    {
      "id": 4,
      "name": "Audio",
      "icon": "🎧",
      "color": "#8b5cf6",
      "count": 67
    },
    {
      "id": 5,
      "name": "Furniture",
      "icon": "🪑",
      "color": "#ef4444",
      "count": 89
    },
    {
      "id": 6,
      "name": "Tablets",
      "icon": "📱",
      "color": "#06b6d4",
      "count": 34
    },
    {
      "id": 7,
      "name": "Accommodation",
      "icon": "🏠",
      "color": "#84cc16",
      "count": 156
    },
    {
      "id": 8,
      "name": "Notes",
      "icon": "📝",
      "color": "#f97316",
      "count": 178
    },
    {
      "id": 9,
      "name": "Stationery",
      "icon": "✏️",
      "color": "#ec4899",
      "count": 92
    }
  ]
};

// Application State
const appState = {
  wishlist: [],
  currentFilter: 'all',
  searchQuery: '',
  activeChips: [],
  isDarkMode: false,
  isLoading: false,
  displayedProducts: 6,
  allProducts: [...appData.products],
  filteredProducts: [...appData.products]
};

// Utility Functions
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { 
    month: 'short', 
    day: 'numeric' 
  });
};

const generateStars = (rating) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars);
};

const showToast = (message, type = 'info') => {
  const toastContainer = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

// Theme Management
const initializeTheme = () => {
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;
  
  if (!themeToggle) {
    console.error('Theme toggle not found');
    return;
  }
  
  // Set initial theme
  body.setAttribute('data-color-scheme', appState.isDarkMode ? 'dark' : 'light');
  themeToggle.innerHTML = appState.isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  
  themeToggle.addEventListener('click', () => {
    appState.isDarkMode = !appState.isDarkMode;
    
    if (appState.isDarkMode) {
      body.setAttribute('data-color-scheme', 'dark');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      body.setAttribute('data-color-scheme', 'light');
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    showToast(`Switched to ${appState.isDarkMode ? 'dark' : 'light'} mode`, 'success');
  });
};

// Categories Management
const renderCategories = () => {
  const container = document.getElementById('categoriesBubbles');
  if (!container) return;
  
  container.innerHTML = appData.categories.map(category => `
    <div class="category-bubble" data-category="${category.name}" style="border-color: ${category.color}20">
      <span class="category-icon">${category.icon}</span>
      <span class="category-name">${category.name}</span>
      <span class="category-count">${category.count}</span>
    </div>
  `).join('');
  
  // Add click handlers
  container.querySelectorAll('.category-bubble').forEach(bubble => {
    bubble.addEventListener('click', () => {
      const category = bubble.dataset.category;
      filterByCategory(category);
      showToast(`Filtered by ${category}`, 'info');
    });
  });
};

// Product Management
const createProductCard = (product) => {
  const isWishlisted = appState.wishlist.includes(product.id);
  const categoryIcon = appData.categories.find(c => c.name === product.category)?.icon || '📦';
  
  return `
    <div class="product-card" data-id="${product.id}" data-category="${product.category}" data-status="${product.status}" data-verified="${product.verified}">
      <div class="product-image">
        ${categoryIcon}
        <div class="product-status status-${product.status.toLowerCase().replace(' ', '-')}">
          ${product.status}
        </div>
      </div>
      <div class="product-content">
        <div class="product-header">
          <h3 class="product-title">${product.title}</h3>
          <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" data-id="${product.id}">
            <i class="fas fa-heart"></i>
          </button>
        </div>
        <div class="product-price">
          <span class="current-price">${formatPrice(product.price)}</span>
          ${product.originalPrice ? `<span class="original-price">${formatPrice(product.originalPrice)}</span>` : ''}
        </div>
        <div class="seller-info">
          <div class="seller-avatar">${product.sellerAvatar}</div>
          <span class="seller-name">${product.seller}</span>
          <div class="seller-rating">
            <span>${product.sellerRating}</span>
            <i class="fas fa-star" style="color: #f59e0b;"></i>
          </div>
          ${product.verified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}
        </div>
        <div class="product-tags">
          ${product.tags.map(tag => `<span class="product-tag">${tag}</span>`).join('')}
        </div>
        <div class="product-footer">
          <span class="product-location">
            <i class="fas fa-map-marker-alt"></i> ${product.location}
          </span>
          <button class="quick-view-btn" data-id="${product.id}">
            Quick View
          </button>
        </div>
      </div>
    </div>
  `;
};

const renderProducts = (forceRefresh = false) => {
  const container = document.getElementById('productsMasonry');
  if (!container) return;
  
  const productsToShow = appState.filteredProducts.slice(0, appState.displayedProducts);
  
  if (forceRefresh) {
    container.innerHTML = '';
    appState.displayedProducts = Math.min(6, appState.filteredProducts.length);
  }
  
  const currentProductCount = container.children.length;
  const newProducts = productsToShow.slice(currentProductCount);
  
  newProducts.forEach(product => {
    container.innerHTML += createProductCard(product);
  });
  
  // Setup event listeners for all product cards
  setupProductEventListeners();
  updateWishlistCount();
  
  // Show message if no products
  if (appState.filteredProducts.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: var(--color-surface); border-radius: var(--radius-lg); border: 1px solid var(--color-border);">
        <h3 style="margin-bottom: 1rem;">No products found</h3>
        <p style="color: var(--color-text-secondary); margin-bottom: 1rem;">Try adjusting your search terms or filters</p>
        <button class="btn btn--primary" onclick="resetFilters()">Reset Filters</button>
      </div>
    `;
  }
};

const resetFilters = () => {
  appState.currentFilter = 'all';
  appState.searchQuery = '';
  appState.activeChips = [];
  appState.filteredProducts = [...appData.products];
  appState.displayedProducts = 6;
  
  // Reset UI
  document.getElementById('searchInput').value = '';
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.filter === 'all');
  });
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.classList.remove('active');
  });
  
  renderProducts(true);
  showToast('Filters reset', 'info');
};

const setupProductEventListeners = () => {
  // Remove existing listeners and add new ones
  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const productId = parseInt(newBtn.dataset.id);
      toggleWishlist(productId);
    });
  });
  
  document.querySelectorAll('.quick-view-btn').forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const productId = parseInt(newBtn.dataset.id);
      showQuickView(productId);
    });
  });
};

// Wishlist Management
const toggleWishlist = (productId) => {
  const index = appState.wishlist.indexOf(productId);
  const btn = document.querySelector(`.wishlist-btn[data-id="${productId}"]`);
  
  if (index > -1) {
    appState.wishlist.splice(index, 1);
    if (btn) btn.classList.remove('active');
    showToast('Removed from wishlist', 'info');
  } else {
    appState.wishlist.push(productId);
    if (btn) btn.classList.add('active');
    showToast('Added to wishlist', 'success');
  }
  
  updateWishlistCount();
};

const updateWishlistCount = () => {
  const badge = document.getElementById('wishlistCount');
  if (badge) {
    badge.textContent = appState.wishlist.length;
    badge.style.display = appState.wishlist.length > 0 ? 'flex' : 'none';
  }
};

// Filtering and Search
const filterProducts = () => {
  let filtered = [...appData.products];
  
  // Apply search filter
  if (appState.searchQuery.trim()) {
    const query = appState.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(product => 
      product.title.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      product.tags.some(tag => tag.toLowerCase().includes(query)) ||
      product.category.toLowerCase().includes(query) ||
      product.seller.toLowerCase().includes(query)
    );
  }
  
  // Apply chip filters
  appState.activeChips.forEach(chip => {
    filtered = filtered.filter(product => {
      if (chip.type === 'status') return product.status === chip.value;
      if (chip.type === 'condition') return product.condition === chip.value;
      if (chip.type === 'verified') return product.verified === (chip.value === 'true');
      if (chip.type === 'category') return product.category === chip.value;
      return true;
    });
  });
  
  // Apply main filter
  switch (appState.currentFilter) {
    case 'trending':
      filtered.sort((a, b) => b.views - a.views);
      break;
    case 'recent':
      filtered.sort((a, b) => new Date(b.datePosted) - new Date(a.datePosted));
      break;
    case 'nearby':
      // Simulate nearby filter
      filtered = filtered.filter(p => p.location.includes('VIT') || p.location.includes('Pune'));
      break;
  }
  
  appState.filteredProducts = filtered;
  appState.displayedProducts = Math.min(6, filtered.length);
  renderProducts(true);
  
  showToast(`Found ${filtered.length} products`, 'info');
};

const filterByCategory = (category) => {
  appState.activeChips = [{ type: 'category', value: category, label: category }];
  updateFilterChips();
  filterProducts();
  
  // Scroll to products
  const discoverSection = document.getElementById('discover');
  if (discoverSection) {
    discoverSection.scrollIntoView({ behavior: 'smooth' });
  }
};

// Search functionality
const setupSearch = () => {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.querySelector('.search-btn');
  
  if (!searchInput) return;
  
  let searchTimeout;
  
  const performSearch = () => {
    appState.searchQuery = searchInput.value.trim();
    filterProducts();
  };
  
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performSearch();
    }, 500);
  });
  
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performSearch();
    }
  });
  
  if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      performSearch();
    });
  }
};

// Filter tabs and chips
const setupFilters = () => {
  // Filter tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      appState.currentFilter = tab.dataset.filter;
      filterProducts();
    });
  });
  
  // Filter chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const isActive = chip.classList.contains('active');
      const type = Object.keys(chip.dataset)[0];
      const value = Object.values(chip.dataset)[0];
      
      if (isActive) {
        chip.classList.remove('active');
        appState.activeChips = appState.activeChips.filter(c => 
          !(c.type === type && c.value === value)
        );
      } else {
        chip.classList.add('active');
        appState.activeChips.push({ type, value, label: chip.textContent });
      }
      
      filterProducts();
    });
  });
};

const updateFilterChips = () => {
  document.querySelectorAll('.filter-chip').forEach(chip => {
    const type = Object.keys(chip.dataset)[0];
    const value = Object.values(chip.dataset)[0];
    const isActive = appState.activeChips.some(c => c.type === type && c.value === value);
    chip.classList.toggle('active', isActive);
  });
};

// Quick View Modal
const showQuickView = (productId) => {
  const product = appData.products.find(p => p.id === productId);
  if (!product) return;
  
  const modal = document.getElementById('quickViewModal');
  const body = document.getElementById('quickViewBody');
  
  if (!modal || !body) {
    console.error('Quick view modal elements not found');
    return;
  }
  
  const categoryIcon = appData.categories.find(c => c.name === product.category)?.icon || '📦';
  
  body.innerHTML = `
    <div class="quick-view-header" style="display: grid; grid-template-columns: 150px 1fr; gap: 2rem; margin-bottom: 2rem;">
      <div class="quick-view-image" style="width: 150px; height: 150px; background: linear-gradient(135deg, var(--color-bg-3), var(--color-bg-4)); display: flex; align-items: center; justify-content: center; font-size: 3rem; border-radius: var(--radius-lg);">
        ${categoryIcon}
      </div>
      <div class="quick-view-info">
        <h2 style="margin-bottom: 1rem;">${product.title}</h2>
        <div class="product-price" style="margin: 1rem 0; display: flex; align-items: center; gap: 1rem;">
          <span class="current-price" style="font-size: 1.5rem; font-weight: bold; color: var(--color-primary-custom);">${formatPrice(product.price)}</span>
          ${product.originalPrice ? `<span class="original-price" style="text-decoration: line-through; color: var(--color-text-secondary);">${formatPrice(product.originalPrice)}</span>` : ''}
        </div>
        <div class="product-tags" style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
          ${product.tags.map(tag => `<span class="product-tag" style="background: var(--color-accent-light); color: var(--color-accent); padding: 0.25rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.8rem;">${tag}</span>`).join('')}
        </div>
      </div>
    </div>
    <div class="quick-view-details" style="margin-bottom: 2rem;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
        <p><strong>Condition:</strong> ${product.condition}</p>
        <p><strong>Status:</strong> ${product.status}</p>
        <p><strong>Location:</strong> ${product.location}</p>
        <p><strong>Posted:</strong> ${formatDate(product.datePosted)}</p>
      </div>
      <p style="margin-top: 1rem;"><strong>Description:</strong></p>
      <p style="color: var(--color-text-secondary); line-height: 1.6;">${product.description}</p>
    </div>
    <div class="seller-details" style="background: var(--color-bg-1); padding: 1rem; border-radius: var(--radius-lg); margin-bottom: 2rem;">
      <h4 style="margin-bottom: 1rem;">Seller Information</h4>
      <div class="seller-info" style="display: flex; align-items: center; gap: 1rem;">
        <div class="seller-avatar" style="width: 48px; height: 48px; background: var(--color-accent); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);">${product.sellerAvatar}</div>
        <div>
          <div class="seller-name" style="font-weight: 600; margin-bottom: 0.25rem;">${product.seller}</div>
          <div class="seller-rating" style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: var(--color-text-secondary);">
            <span>Rating: ${product.sellerRating}</span>
            <span style="color: #f59e0b;">${generateStars(product.sellerRating)}</span>
            ${product.verified ? '<i class="fas fa-check-circle" style="color: var(--color-success); margin-left: 0.5rem;"></i>' : ''}
          </div>
        </div>
      </div>
    </div>
    <div class="quick-view-actions" style="display: flex; gap: 1rem;">
      <button class="btn btn--primary" style="flex: 1;" onclick="showToast('WhatsApp contact feature coming soon!', 'info')">
        <i class="fas fa-whatsapp"></i> Contact Seller
      </button>
      <button class="btn btn--outline wishlist-btn-modal" data-id="${product.id}">
        <i class="fas fa-heart"></i> ${appState.wishlist.includes(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
      </button>
    </div>
  `;
  
  modal.classList.remove('hidden');
  
  // Setup wishlist button in modal
  const wishlistBtn = body.querySelector('.wishlist-btn-modal');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleWishlist(product.id);
      // Update button text
      wishlistBtn.innerHTML = `<i class="fas fa-heart"></i> ${appState.wishlist.includes(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}`;
    });
  }
};

// Modal Management
const setupModals = () => {
  const quickViewModal = document.getElementById('quickViewModal');
  const sellModal = document.getElementById('sellModal');
  
  if (quickViewModal) {
    const closeBtn = quickViewModal.querySelector('.modal-close');
    const backdrop = quickViewModal.querySelector('.modal-backdrop');
    
    if (closeBtn) closeBtn.addEventListener('click', () => quickViewModal.classList.add('hidden'));
    if (backdrop) backdrop.addEventListener('click', () => quickViewModal.classList.add('hidden'));
  }
  
  if (sellModal) {
    const closeBtn = sellModal.querySelector('.modal-close');
    const backdrop = sellModal.querySelector('.modal-backdrop');
    
    if (closeBtn) closeBtn.addEventListener('click', () => sellModal.classList.add('hidden'));
    if (backdrop) backdrop.addEventListener('click', () => sellModal.classList.add('hidden'));
    
    // Sell form handler
    const sellForm = sellModal.querySelector('.sell-form');
    if (sellForm) {
      sellForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Item listed successfully! 🎉', 'success');
        sellModal.classList.add('hidden');
        sellForm.reset();
      });
    }
  }
  
  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
        modal.classList.add('hidden');
      });
    }
  });
};

// FAB Actions
const setupFABs = () => {
  const fabSell = document.getElementById('fabSell');
  const fabWishlist = document.getElementById('fabWishlist');
  const fabChat = document.getElementById('fabChat');
  
  if (fabSell) {
    fabSell.addEventListener('click', () => {
      const sellModal = document.getElementById('sellModal');
      if (sellModal) {
        sellModal.classList.remove('hidden');
      }
    });
  }
  
  if (fabWishlist) {
    fabWishlist.addEventListener('click', () => {
      if (appState.wishlist.length === 0) {
        showToast('Your wishlist is empty! ❤️ Add some items first.', 'info');
        return;
      }
      
      // Filter to show only wishlisted items
      const wishlistedProducts = appData.products.filter(p => appState.wishlist.includes(p.id));
      appState.filteredProducts = wishlistedProducts;
      appState.displayedProducts = wishlistedProducts.length;
      renderProducts(true);
      
      const discoverSection = document.getElementById('discover');
      if (discoverSection) {
        discoverSection.scrollIntoView({ behavior: 'smooth' });
      }
      showToast(`Showing ${wishlistedProducts.length} wishlisted items`, 'info');
    });
  }
  
  if (fabChat) {
    fabChat.addEventListener('click', () => {
      showToast('💬 Chat feature coming soon!', 'info');
    });
  }
};

// Infinite Scroll
const setupInfiniteScroll = () => {
  const loadingSpinner = document.getElementById('loadingSpinner');
  if (!loadingSpinner) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !appState.isLoading && appState.displayedProducts < appState.filteredProducts.length) {
        appState.isLoading = true;
        loadingSpinner.style.display = 'block';
        
        setTimeout(() => {
          const nextBatchSize = Math.min(6, appState.filteredProducts.length - appState.displayedProducts);
          appState.displayedProducts += nextBatchSize;
          
          renderProducts();
          
          appState.isLoading = false;
          loadingSpinner.style.display = 'none';
          
          if (appState.displayedProducts >= appState.filteredProducts.length) {
            loadingSpinner.style.display = 'none';
          }
        }, 800);
      }
    });
  }, { threshold: 0.1 });
  
  observer.observe(loadingSpinner);
};

// Scroll Effects
const setupScrollEffects = () => {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
};

// Navigation
const setupNavigation = () => {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('href');
      const element = document.querySelector(target);
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Handle navigation for pages that don't exist yet
        if (target === '#profile') {
          showToast('👤 Profile page coming soon!', 'info');
        } else if (target === '#sell') {
          document.getElementById('sellModal')?.classList.remove('hidden');
        }
      }
    });
  });
  
  // Hero action buttons
  document.querySelectorAll('.hero-actions .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.textContent.includes('Shopping')) {
        document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        document.getElementById('sellModal')?.classList.remove('hidden');
      }
    });
  });
};

// Mobile Menu
const setupMobileMenu = () => {
  const toggle = document.getElementById('mobileMenuToggle');
  const menu = document.getElementById('navMenu');
  
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      menu.classList.toggle('active');
    });
  }
};

// Application Initialization
const initializeApp = () => {
  console.log('🚀 StudXchange App Initializing...');
  
  try {
    // Initialize theme
    initializeTheme();
    
    // Render initial content
    renderCategories();
    renderProducts();
    
    // Setup all event listeners
    setupSearch();
    setupFilters();
    setupModals();
    setupFABs();
    setupInfiniteScroll();
    setupScrollEffects();
    setupMobileMenu();
    setupNavigation();
    
    // Update wishlist count
    updateWishlistCount();
    
    console.log('✅ StudXchange App Ready!');
    
    // Welcome message
    setTimeout(() => {
      showToast('Welcome to StudXchange! 🎓✨', 'success');
    }, 1500);
    
  } catch (error) {
    console.error('Error initializing app:', error);
  }
};

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}