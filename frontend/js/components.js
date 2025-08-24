// js/components.js - Reusable UI Components
class UIComponents {
  // Create product card
  static createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = product.id;

    const isOwner = window.auth.isAuthenticated && 
                   window.auth.user && 
                   product.seller === window.auth.user.name;

    card.innerHTML = `
      <div class="product-image-container">
        <img src="${product.images[0] || 'https://via.placeholder.com/300x200/e5e7eb/6b7280?text=No+Image'}" 
             alt="${product.title}" 
             class="product-image"
             onerror="this.src='https://via.placeholder.com/300x200/e5e7eb/6b7280?text=No+Image'">
        
        ${product.urgent ? '<span class="urgent-badge">Urgent</span>' : ''}
        ${product.verified ? '<i class="fas fa-check-circle verified-badge" title="Verified Seller"></i>' : ''}
        
        <div class="product-actions">
          <button class="save-btn ${product.isSaved ? 'saved' : ''}" 
                  data-product-id="${product.id}"
                  title="${product.isSaved ? 'Remove from saved' : 'Save item'}">
            <i class="fas fa-heart"></i>
          </button>
          ${isOwner ? `
            <button class="edit-btn" data-product-id="${product.id}" title="Edit item">
              <i class="fas fa-edit"></i>
            </button>
          ` : ''}
        </div>
      </div>
      
      <div class="product-info">
        <div class="product-header">
          <h3 class="product-title">${product.title}</h3>
          <span class="product-condition ${product.condition.toLowerCase()}">${product.condition}</span>
        </div>
        
        <div class="product-price">
          <span class="current-price">₹${product.price.toLocaleString()}</span>
          ${product.originalPrice ? `
            <span class="original-price">₹${product.originalPrice.toLocaleString()}</span>
            <span class="discount">${Math.round((1 - product.price/product.originalPrice) * 100)}% off</span>
          ` : ''}
        </div>
        
        <div class="product-meta">
          <div class="seller-info">
            <div class="seller-avatar">${product.sellerAvatar}</div>
            <div class="seller-details">
              <span class="seller-name">${product.seller}</span>
              <div class="seller-rating">
                ${this.createStarRating(product.sellerRating)}
                <span class="rating-value">${product.sellerRating}</span>
              </div>
            </div>
          </div>
          
          <div class="product-location">
            <i class="fas fa-map-marker-alt"></i>
            <span>${product.location}</span>
          </div>
        </div>
        
        <div class="product-stats">
          <span class="stat">
            <i class="fas fa-eye"></i>
            ${product.views}
          </span>
          <span class="stat">
            <i class="fas fa-heart"></i>
            ${product.saves}
          </span>
          <span class="stat">
            <i class="fas fa-clock"></i>
            ${this.getTimeAgo(product.datePosted)}
          </span>
        </div>
        
        ${product.tags && product.tags.length > 0 ? `
          <div class="product-tags">
            ${product.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        ` : ''}
        
        <div class="product-card-actions">
          ${!isOwner ? `
            <button class="btn btn-primary contact-seller-btn" data-product-id="${product.id}">
              <i class="fas fa-comment"></i>
              Contact Seller
            </button>
          ` : `
            <button class="btn btn-secondary manage-item-btn" data-product-id="${product.id}">
              <i class="fas fa-cog"></i>
              Manage Item
            </button>
          `}
          <button class="btn btn-outline view-details-btn" data-product-id="${product.id}">
            View Details
          </button>
        </div>
      </div>
    `;

    // Add event listeners
    this.addProductCardListeners(card);
    return card;
  }

  // Create star rating
  static createStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let stars = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars += '<i class="fas fa-star"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
      stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
  }

  // Get time ago string
  static getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  }

  // Add event listeners to product card
  static addProductCardListeners(card) {
    const productId = card.dataset.productId;

    // Save button
    const saveBtn = card.querySelector('.save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleSaveItem(productId, saveBtn);
      });
    }

    // Edit button
    const editBtn = card.querySelector('.edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleEditItem(productId);
      });
    }

    // Contact seller button
    const contactBtn = card.querySelector('.contact-seller-btn');
    if (contactBtn) {
      contactBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleContactSeller(productId);
      });
    }

    // View details button
    const viewBtn = card.querySelector('.view-details-btn');
    if (viewBtn) {
      viewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleViewDetails(productId);
      });
    }

    // Card click for details
    card.addEventListener('click', () => {
      this.handleViewDetails(productId);
    });
  }

  // Handle save item
  static async handleSaveItem(productId, saveBtn) {
    if (!window.auth.requireAuth(() => this.handleSaveItem(productId, saveBtn))) {
      return;
    }

    try {
      const response = await window.api.saveItem(productId);
      const icon = saveBtn.querySelector('i');
      
      if (response.saved) {
        saveBtn.classList.add('saved');
        saveBtn.title = 'Remove from saved';
        window.auth.showToast('Item saved!', 'success');
      } else {
        saveBtn.classList.remove('saved');
        saveBtn.title = 'Save item';
        window.auth.showToast('Item removed from saved', 'info');
      }
    } catch (error) {
      window.auth.showToast('Failed to save item', 'error');
    }
  }

  // Handle edit item
  static handleEditItem(productId) {
    // TODO: Implement edit item modal
    console.log('Edit item:', productId);
  }

  // Handle contact seller
  static async handleContactSeller(productId) {
    if (!window.auth.requireAuth(() => this.handleContactSeller(productId))) {
      return;
    }

    try {
      const response = await window.api.createChat(productId);
      // TODO: Open chat interface
      console.log('Chat created:', response.chat);
      window.auth.showToast('Chat started with seller!', 'success');
    } catch (error) {
      window.auth.showToast('Failed to start chat', 'error');
    }
  }

  // Handle view details
  static handleViewDetails(productId) {
    // TODO: Implement product details modal or page
    console.log('View details for product:', productId);
  }

  // Create loading spinner
  static createLoadingSpinner() {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = `
      <div class="spinner"></div>
      <p>Loading...</p>
    `;
    return spinner;
  }

  // Create empty state
  static createEmptyState(message, icon = 'fas fa-box-open') {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <i class="${icon}"></i>
      <h3>No items found</h3>
      <p>${message}</p>
    `;
    return emptyState;
  }

  // Create filter chip
  static createFilterChip(label, value, isActive = false) {
    const chip = document.createElement('button');
    chip.className = `filter-chip ${isActive ? 'active' : ''}`;
    chip.dataset.value = value;
    chip.innerHTML = `
      <span>${label}</span>
      ${isActive ? '<i class="fas fa-times"></i>' : ''}
    `;
    return chip;
  }

  // Create notification toast
  static createToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };

    toast.innerHTML = `
      <i class="${icons[type]}"></i>
      <span>${message}</span>
      <button class="toast-close">
        <i class="fas fa-times"></i>
      </button>
    `;

    // Add close functionality
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    });

    return toast;
  }

  // Create pagination
  static createPagination(currentPage, totalPages, onPageChange) {
    const pagination = document.createElement('div');
    pagination.className = 'pagination';

    if (totalPages <= 1) return pagination;

    // Previous button
    if (currentPage > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.className = 'pagination-btn';
      prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
      prevBtn.addEventListener('click', () => onPageChange(currentPage - 1));
      pagination.appendChild(prevBtn);
    }

    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
      const firstBtn = this.createPageButton(1, onPageChange, currentPage === 1);
      pagination.appendChild(firstBtn);
      
      if (startPage > 2) {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'pagination-ellipsis';
        ellipsis.textContent = '...';
        pagination.appendChild(ellipsis);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = this.createPageButton(i, onPageChange, i === currentPage);
      pagination.appendChild(pageBtn);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'pagination-ellipsis';
        ellipsis.textContent = '...';
        pagination.appendChild(ellipsis);
      }
      
      const lastBtn = this.createPageButton(totalPages, onPageChange, currentPage === totalPages);
      pagination.appendChild(lastBtn);
    }

    // Next button
    if (currentPage < totalPages) {
      const nextBtn = document.createElement('button');
      nextBtn.className = 'pagination-btn';
      nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
      nextBtn.addEventListener('click', () => onPageChange(currentPage + 1));
      pagination.appendChild(nextBtn);
    }

    return pagination;
  }

  static createPageButton(page, onPageChange, isActive) {
    const btn = document.createElement('button');
    btn.className = `pagination-btn ${isActive ? 'active' : ''}`;
    btn.textContent = page;
    btn.addEventListener('click', () => onPageChange(page));
    return btn;
  }
}

// Export to global scope
window.UIComponents = UIComponents;
