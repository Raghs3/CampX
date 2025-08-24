// js/api.js - API Communication Module
class APIClient {
  constructor() {
    this.baseURL = window.location.origin + '/api';
    this.token = localStorage.getItem('authToken');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async updateProfile(data) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Items methods
  async getItems(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/items?${params}`);
  }

  async getItem(id) {
    return this.request(`/items/${id}`);
  }

  async createItem(formData) {
    return this.request('/items', {
      method: 'POST',
      headers: {}, // Remove Content-Type for FormData
      body: formData
    });
  }

  async updateItem(id, formData) {
    return this.request(`/items/${id}`, {
      method: 'PUT',
      headers: {}, // Remove Content-Type for FormData
      body: formData
    });
  }

  async deleteItem(id) {
    return this.request(`/items/${id}`, {
      method: 'DELETE'
    });
  }

  async saveItem(id) {
    return this.request(`/items/${id}/save`, {
      method: 'POST'
    });
  }

  async getMyItems(status) {
    const params = status ? `?status=${status}` : '';
    return this.request(`/items/user/my-items${params}`);
  }

  async getSavedItems() {
    return this.request('/items/user/saved');
  }

  // AI methods
  async analyzeImage(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return this.request('/ai/analyze-image', {
      method: 'POST',
      headers: {}, // Remove Content-Type for FormData
      body: formData
    });
  }

  async enhanceDescription(data) {
    return this.request('/ai/enhance-description', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async suggestPrice(data) {
    return this.request('/ai/suggest-price', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async smartSearch(query, userProfile = {}) {
    return this.request('/ai/smart-search', {
      method: 'POST',
      body: JSON.stringify({ query, userProfile })
    });
  }

  async suggestMessage(data) {
    return this.request('/ai/suggest-message', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Chat methods
  async getChats() {
    return this.request('/chat');
  }

  async getChat(chatId) {
    return this.request(`/chat/${chatId}`);
  }

  async createChat(itemId, participantId) {
    return this.request('/chat/create', {
      method: 'POST',
      body: JSON.stringify({ itemId, participantId })
    });
  }

  async sendMessage(chatId, content, messageType = 'text', offer = null) {
    return this.request(`/chat/${chatId}/message`, {
      method: 'POST',
      body: JSON.stringify({ content, messageType, offer })
    });
  }

  async respondToOffer(chatId, messageId, status) {
    return this.request(`/chat/${chatId}/message/${messageId}/offer`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  async deleteChat(chatId) {
    return this.request(`/chat/${chatId}`, {
      method: 'DELETE'
    });
  }
}

// Export API client instance
window.api = new APIClient();
