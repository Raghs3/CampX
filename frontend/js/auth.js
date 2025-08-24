// js/auth.js - Authentication Management
class AuthManager {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
    this.init();
  }

  async init() {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        window.api.setToken(token);
        const response = await window.api.getCurrentUser();
        this.setUser(response.user);
      } catch (error) {
        console.error('Auto-login failed:', error);
        this.logout();
      }
    }
    this.updateUI();
  }

  setUser(user) {
    this.user = user;
    this.isAuthenticated = true;
    this.updateUI();
    this.dispatchAuthEvent('login', user);
  }

  logout() {
    this.user = null;
    this.isAuthenticated = false;
    window.api.clearToken();
    this.updateUI();
    this.dispatchAuthEvent('logout');
  }

  updateUI() {
    const authButtons = document.querySelector('.auth-buttons');
    const userMenu = document.querySelector('.user-menu');
    const userAvatar = document.querySelector('.user-avatar');

    if (this.isAuthenticated && this.user) {
      // Update user avatar
      if (userAvatar) {
        userAvatar.innerHTML = `<span>${this.user.initials || this.user.name.charAt(0)}</span>`;
        userAvatar.style.display = 'flex';
      }

      // Show user menu, hide auth buttons
      if (userMenu) userMenu.style.display = 'block';
      if (authButtons) authButtons.style.display = 'none';

      // Update any user info displays
      this.updateUserInfo();
    } else {
      // Show auth buttons, hide user menu
      if (userMenu) userMenu.style.display = 'none';
      if (authButtons) authButtons.style.display = 'flex';
      if (userAvatar) userAvatar.style.display = 'none';
    }
  }

  updateUserInfo() {
    // Update user name displays
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => {
      el.textContent = this.user.name;
    });

    // Update user campus displays
    const userCampusElements = document.querySelectorAll('.user-campus');
    userCampusElements.forEach(el => {
      el.textContent = this.user.campus;
    });
  }

  dispatchAuthEvent(type, data = null) {
    const event = new CustomEvent(`auth:${type}`, { detail: data });
    document.dispatchEvent(event);
  }

  async showLoginModal() {
    const modal = this.createAuthModal('login');
    document.body.appendChild(modal);
    modal.style.display = 'flex';
  }

  async showRegisterModal() {
    const modal = this.createAuthModal('register');
    document.body.appendChild(modal);
    modal.style.display = 'flex';
  }

  createAuthModal(type) {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
      <div class="auth-modal-content">
        <span class="auth-modal-close">&times;</span>
        <h2>${type === 'login' ? 'Login to CampX' : 'Join CampX'}</h2>
        <form class="auth-form" data-type="${type}">
          ${type === 'register' ? `
            <div class="form-group">
              <label for="name">Full Name</label>
              <input type="text" id="name" name="name" required>
            </div>
          ` : ''}
          
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
          </div>
          
          ${type === 'register' ? `
            <div class="form-group">
              <label for="campus">Campus/University</label>
              <select id="campus" name="campus" required>
                <option value="">Select your campus</option>
                <option value="VIT Pune">VIT Pune</option>
                <option value="IIT Bombay">IIT Bombay</option>
                <option value="Delhi University">Delhi University</option>
                <option value="BITS Pilani">BITS Pilani</option>
                <option value="Manipal University">Manipal University</option>
                <option value="Anna University">Anna University</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="year">Academic Year</label>
              <select id="year" name="year">
                <option value="">Select year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Graduate">Graduate</option>
                <option value="Faculty">Faculty</option>
              </select>
            </div>
          ` : ''}
          
          <button type="submit" class="auth-submit-btn">
            ${type === 'login' ? 'Login' : 'Create Account'}
          </button>
          
          <div class="auth-switch">
            ${type === 'login' 
              ? `Don't have an account? <a href="#" class="switch-to-register">Sign up</a>`
              : `Already have an account? <a href="#" class="switch-to-login">Login</a>`
            }
          </div>
        </form>
      </div>
    `;

    // Add event listeners
    this.addAuthModalListeners(modal);
    return modal;
  }

  addAuthModalListeners(modal) {
    const closeBtn = modal.querySelector('.auth-modal-close');
    const form = modal.querySelector('.auth-form');
    const switchLinks = modal.querySelectorAll('.switch-to-login, .switch-to-register');

    // Close modal
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      const type = form.dataset.type;

      try {
        const submitBtn = form.querySelector('.auth-submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = type === 'login' ? 'Logging in...' : 'Creating account...';

        let response;
        if (type === 'login') {
          response = await window.api.login(data.email, data.password);
        } else {
          response = await window.api.register(data);
        }

        // Store token and user data
        window.api.setToken(response.token);
        this.setUser(response.user);

        // Close modal and show success
        modal.remove();
        this.showToast(`${type === 'login' ? 'Logged in' : 'Account created'} successfully!`, 'success');

      } catch (error) {
        this.showToast(error.message, 'error');
        const submitBtn = form.querySelector('.auth-submit-btn');
        submitBtn.disabled = false;
        submitBtn.textContent = type === 'login' ? 'Login' : 'Create Account';
      }
    });

    // Handle auth type switching
    switchLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const newType = link.classList.contains('switch-to-login') ? 'login' : 'register';
        modal.remove();
        
        if (newType === 'login') {
          this.showLoginModal();
        } else {
          this.showRegisterModal();
        }
      });
    });
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  requireAuth(callback) {
    if (!this.isAuthenticated) {
      this.showLoginModal();
      return false;
    }
    callback();
    return true;
  }
}

// Initialize auth manager
window.auth = new AuthManager();
