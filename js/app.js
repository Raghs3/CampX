// Campus Marketplace Frontend

// Backend Base URL - automatically detects production vs local
const API_BASE = window.location.origin;

// Track current logged-in user (set by fetchCurrentUser)
let currentUser = null;

let editingProductId = null;

// Category icon mapping for UI badges
const CAT_ICON_MAP = {
  'Books':'📚', 'Book':'📚', 'Textbooks':'📚', 'Textbook':'📚',
  'Furniture':'🪑',
  'Laptop':'💻', 'Laptops':'💻', 'Computers':'💻',
  'Electronics':'🔌', 'Audio':'🎧', 'Tablets':'📱', 'Mobile':'📱', 'Phone':'📱',
  'Notes':'📝', 'Stationery':'✏️', 'Accommodation':'🏠'
};

async function fetchCurrentUser() {
  try {
    const res = await fetch(`${API_BASE}/api/current-user`, { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    currentUser = data.user;
    return currentUser;
  } catch (err) {
    console.error('Failed to fetch current user', err);
    return null;
  }
}

// Populate category dropdown with all available categories
async function populateCategories() {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    const allProducts = await res.json();
    const catSelect = document.getElementById('categoryFilter');
    if (!catSelect || catSelect.dataset.populated) return;
    
    const uniqueCats = [...new Set(allProducts.filter(p=>p.category).map(p=>p.category))].sort();
    uniqueCats.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      catSelect.appendChild(opt);
    });
    catSelect.dataset.populated = 'true';

    // Build category chips section
    const counts = allProducts.reduce((acc,p)=>{ if(p.category){ acc[p.category]=(acc[p.category]||0)+1; } return acc; },{});
    const sorted = Object.entries(counts).sort((a,b)=> a[0].localeCompare(b[0]));
    const sec = document.getElementById('categoriesSection');
    if (sec) {
      if (sorted.length === 0) { sec.style.display = 'none'; }
      else {
        sec.style.display = 'block';
        let chips = sorted.map(([cat,count])=>{
          const icon = CAT_ICON_MAP[cat] || '🛒';
          return `<button class="category-chip" data-cat="${cat.replace(/"/g,'&quot;')}">${icon}<span>${cat}</span><em class="category-count">${count}</em></button>`;
        }).join('');
        sec.innerHTML = `
          <h2 class="categories-title">Explore Categories</h2>
          <div class="category-grid">${chips}</div>
        `;
        // delegate click
        sec.addEventListener('click', async (e)=>{
          const btn = e.target.closest('.category-chip');
          if (!btn) return;
          const cat = btn.getAttribute('data-cat') || '';
          const sel = document.getElementById('categoryFilter');
          if (sel) sel.value = cat;
          await loadProducts();
          window.scrollTo({ top: document.getElementById('productList').offsetTop - 20, behavior:'smooth' });
        });
      }
    }
  } catch (err) {
    console.error('Failed to populate categories', err);
  }
}

//  Load Products from Backend
async function loadProducts() {
  try {
    const categoryValue = document.getElementById('categoryFilter')?.value || '';
    const searchValue = document.getElementById('searchInput')?.value || '';
    console.log('loadProducts called with:', { categoryValue, searchValue });
    const params = new URLSearchParams();
    if (categoryValue) params.append('category', categoryValue);
    if (searchValue) params.append('q', searchValue.trim());
    const url = `${API_BASE}/api/products${params.toString() ? ('?' + params.toString()) : ''}`;
    console.log('Fetching URL:', url);
    const res = await fetch(url);
    const products = await res.json();
    console.log('Products received:', products.length);

    const container = document.getElementById("productList");
    container.innerHTML = "";

    if (products.length === 0) {
      container.innerHTML = `<p style="text-align:center;padding:40px;color:var(--card-text);">No products found matching your filters.</p>`;
      return;
    }

    // Update hero stats if present
    const heroStats = document.getElementById('heroStats');
    if (heroStats) {
      const total = products.length;
      const sold = products.filter(p=> p.status && p.status.toLowerCase()==='sold').length;
      const categories = new Set(products.map(p=>p.category).filter(Boolean)).size;
      heroStats.innerHTML = `${total} items • ${categories} categories • ${sold} sold`;
    }

    const catIconMap = CAT_ICON_MAP;
    const placeholderImg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='%237b2ff7'/><stop offset='1' stop-color='%235b5bff'/></linearGradient></defs><rect fill='url(%23g)' width='300' height='200'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='22' font-family='Inter,sans-serif'>No Image</text></svg>";

    products.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'product-card';
      const isSeller = currentUser && currentUser.user_id === p.seller_id;
      const imgSrcRaw = p.image1 || p.image2 || p.image3 || '';
      const imgSrc = imgSrcRaw ? (imgSrcRaw.startsWith('/uploads') ? API_BASE + imgSrcRaw : imgSrcRaw) : placeholderImg;
      const initials = (p.seller_name || 'U').split(/\s+/).map(s=>s[0]).join('').slice(0,2).toUpperCase();
      const catIcon = catIconMap[p.category] || '🛒';
      const shortDesc = (p.description || '').slice(0,90) + ((p.description || '').length>90 ? '…' : '');
      card.innerHTML = `
        <div class="card-image" style="background-image:url('${imgSrc.replace(/'/g, "%27")}')">
          <span class="status-badge ${p.status && p.status.toLowerCase() === 'sold' ? 'sold' : 'available'}">${p.status || 'Available'}</span>
          <div class="category-badge">${catIcon} ${p.category || 'General'}</div>
        </div>
        <div class="card-row">
          <div class="avatar" title="${(p.seller_name||'Seller').replace(/'/g, "\'")}">${initials}</div>
          <div style="flex:1;">
            <h3>${p.title}</h3>
            <p><strong>₹${p.price}</strong> • ${p.condition || 'Condition'} • Stock: ${p.quantity || 0}</p>
            <p style="font-size:0.78rem;opacity:0.7;">${shortDesc}</p>
          </div>
        </div>
        <div class="buttons">
          ${isSeller ? `<button class="edit-btn" onclick="editProduct(${p.product_id})">Edit</button><button class="delete-btn" onclick="deleteProduct(${p.product_id})">Delete</button>` : ''}
          <button class="contact-btn" onclick="contactSeller(${p.seller_id}, '${(p.seller_name||'').replace(/'/g, "\'")}')">Contact</button>
          <button class="buy-btn" onclick="showDetails(${p.product_id})">Details</button>
        </div>`;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading products:", err);
  }
}

// Toggle product status (only seller can do this)
async function toggleProductStatus(id, currentStatus) {
  const newStatus = (currentStatus && currentStatus.toLowerCase() === 'sold') ? 'Available' : 'Sold';
  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.message || `Status changed to ${newStatus}`);
      await loadProducts();
    } else {
      const data = await res.json().catch(() => ({}));
      console.error('Status change failed:', data);
      alert(data.error || data.message || 'Failed to change status');
    }
  } catch (err) {
    console.error('Status change error', err);
    alert('Network error while changing status');
  }
}

//  Add New Product
async function addProduct(event) {
  event.preventDefault();

  const title = (document.getElementById("title").value || '').trim();
  const category = document.getElementById("category").value;
  const price = parseFloat(document.getElementById("price").value);
  const condition = document.getElementById("condition").value;
  const description = document.getElementById("description").value;
  const contact_info = (document.getElementById("contact_info") && document.getElementById("contact_info").value) || null;
  const quantity = parseInt(document.getElementById("quantity").value) || 1;
  const f1 = document.getElementById('image1File');
  const f2 = document.getElementById('image2File');
  const f3 = document.getElementById('image3File');
  const files = [];
  if (f1 && f1.files && f1.files[0]) files.push({ name: 'image1', file: f1.files[0] });
  if (f2 && f2.files && f2.files[0]) files.push({ name: 'image2', file: f2.files[0] });
  if (f3 && f3.files && f3.files[0]) files.push({ name: 'image3', file: f3.files[0] });

  if (!title) {
    const titleInput = document.getElementById('title');
    alert('Title is required');
    if (titleInput) {
      titleInput.classList.add('input-error');
      titleInput.focus();
      setTimeout(() => titleInput.classList.remove('input-error'), 2500);
    }
    return;
  }
  if (!price || isNaN(price)) {
    const priceInput = document.getElementById('price');
    alert('Valid price is required');
    if (priceInput) {
      priceInput.classList.add('input-error');
      priceInput.focus();
      setTimeout(() => priceInput.classList.remove('input-error'), 2500);
    }
    return;
  }

  const formData = new FormData();
  formData.append('title', title || '');
  formData.append('category', category || '');
  formData.append('price', price || 0);
  formData.append('condition', condition || '');
  formData.append('description', description || '');
  formData.append('contact_info', contact_info || '');
  formData.append('quantity', quantity);
  if (!editingProductId) formData.append('status', 'Available');
  // Require at least one image
  if (!files.length) {
    alert('Please upload at least one product image');
    return;
  }
  files.forEach(({name, file}) => formData.append(name, file));

  // Debug: log what we're sending
  console.log('FormData contents:', {
    title: formData.get('title'),
    category: formData.get('category'),
    price: formData.get('price'),
    condition: formData.get('condition'),
    description: formData.get('description'),
    contact_info: formData.get('contact_info'),
    status: formData.get('status'),
    files: files.map(f => f.name)
  });

  try {
    let res;
    if (editingProductId) {
      // Update existing
      res = await fetch(`${API_BASE}/api/products/${editingProductId}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });
    } else {
      // Create new
      res = await fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
    }

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      alert(data.message || (editingProductId ? ' Product updated' : ' Product added successfully!'));
      document.getElementById('productForm').reset();
      // close modal if present
      const modal = document.getElementById('productModal');
      if (modal) modal.style.display = 'none';
      // reset editing state and modal title
      editingProductId = null;
      const h2 = document.querySelector('#productModal .modal-content h2');
      if (h2) h2.innerText = 'Add New Product';
      await loadProducts();
    } else {
      console.error('Add/Update product failed response:', data);
      alert(data.error || data.message || ' Failed to add/update product');
    }
  } catch (err) {
    console.error('Add/Update error', err);
    alert(' Network or server error while saving product');
  }
}

//  Edit Existing Product

async function editProduct(id) {
  // Open product modal and prefill fields for editing
  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`);
    if (!res.ok) return alert('Could not fetch product for editing');
    const data = await res.json();
    const p = data.product;

    // Prefill modal inputs
    document.getElementById('title').value = p.title || '';
    document.getElementById('category').value = p.category || '';
    document.getElementById('price').value = p.price || '';
    document.getElementById('condition').value = p.condition || '';
    document.getElementById('description').value = p.description || '';
    document.getElementById('contact_info').value = p.contact_method || p.contact_info || '';

    // set editing id and change title
    editingProductId = id;
    const modal = document.getElementById('productModal');
    const h2 = document.querySelector('#productModal .modal-content h2');
    if (h2) h2.innerText = 'Edit Product';
    if (modal) modal.style.display = 'flex';
  } catch (err) {
    console.error('Edit fetch error', err);
    alert('Error preparing edit form');
  }
}

//  Delete Product

async function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  const res = await fetch(`${API_BASE}/api/products/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (res.ok) {
    alert("Product deleted");
    loadProducts();
  } else {
    alert("Delete failed");
  }
}

// Show Sold Items 

async function showSoldItems() {
  const modal = document.getElementById('soldModal');
  const container = document.getElementById('soldContainer');
  container.innerHTML = '';
  try {
    const res = await fetch(`${API_BASE}/api/sold`, { credentials: 'include' });
    if (!res.ok) {
      const b = await res.json().catch(()=>({}));
      container.innerHTML = `<div style="padding:1rem;text-align:center;"><p style="font-weight:600;margin-bottom:8px;">${b.error || 'Failed to load sold items'}</p></div>`;
      modal.style.display = 'flex';
      document.getElementById('closeSold').onclick = () => { modal.style.display = 'none'; };
      return;
    }

    const data = await res.json();
    const items = data.items || [];
    if (items.length === 0) container.innerHTML = '<p style="padding:12px;">No sold items yet</p>';

    items.forEach(it => {
      const c = document.createElement('div');
      c.className = 'product-card';
      c.style.minHeight = '120px';
      
      // Check if current user is the buyer (can review)
      const isBuyer = currentUser && currentUser.user_id === it.buyer_id;
      
      console.log('Sold item data:', { seller_id: it.seller_id, product_id: it.product_id, buyer_id: it.buyer_id, isBuyer });
      
      c.innerHTML = `
        <h3>${it.title || 'Item'}</h3>
        <p><strong>Price:</strong> ₹${it.price || 0}</p>
        <p style="font-size:0.9rem;color:var(--card-text);">${(it.description||'').slice(0,140)}</p>
        <div style="margin-top:8px;display:flex;gap:8px;justify-content:space-between;align-items:center;">
          <div style="font-size:0.85rem;color:var(--card-text);">Sold At: ${new Date(it.sold_at).toLocaleDateString()}</div>
          <div style="text-align:right;font-size:0.85rem;color:var(--card-text);">
            Seller: ${it.seller_name||'N/A'}<br/>
            Buyer: ${it.buyer_name||'N/A'}
          </div>
        </div>
        ${isBuyer && it.seller_id ? `
        <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end;">
          <button class="add-btn" onclick="openReviewModal(${it.seller_id}, ${it.product_id || 'null'}, '${it.seller_name||'Seller'}')">Review Seller</button>
          <button class="contact-btn" onclick="viewSellerReviews(${it.seller_id}, '${it.seller_name||'Seller'}')">View Reviews</button>
        </div>` : ''}
      `;
      container.appendChild(c);
    });

    modal.style.display = 'flex';
    document.getElementById('closeSold').onclick = () => { modal.style.display = 'none'; };
  } catch (err) {
    console.error('Fetch sold items failed', err);
    container.innerHTML = '<p>Error loading sold items</p>';
    modal.style.display = 'flex';
    document.getElementById('closeSold').onclick = () => { modal.style.display = 'none'; };
  }
}

// Contact Seller (Queue-based messaging feature)

async function contactSeller(sellerId, sellerName) {
  const messageText = prompt(`Send a message to ${sellerName}:`);
  if (!messageText) return;

  const msg = {
    receiver_id: sellerId,
    message_text: messageText,
  };

  const res = await fetch(`${API_BASE}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ item_id: null, ...msg }),
  });

  if (res.ok) {
    alert(`Message sent to ${sellerName}`);
  } else {
    alert("Failed to send message");
  }
}

//  Initialize
document.addEventListener("DOMContentLoaded", () => {
  (async () => {
    await fetchCurrentUser();
    await loadProducts();
  })();

  // Hero CTA buttons
  const heroAdd = document.getElementById('heroAddBtn');
  if (heroAdd) heroAdd.addEventListener('click', () => {
    const modal = document.getElementById('productModal');
    const h2 = document.querySelector('#productModal .modal-content h2');
    if (h2) h2.innerText = 'Add New Product';
    if (modal) modal.style.display = 'flex';
  });
  const heroBrowse = document.getElementById('heroBrowseBtn');
  if (heroBrowse) heroBrowse.addEventListener('click', async () => {
    document.getElementById('searchInput')?.focus();
    await loadProducts();
    window.scrollTo({ top: document.getElementById('productList').offsetTop - 20, behavior: 'smooth' });
  });

  // ====== AI PRICE PREDICTION ======
  const getPriceSuggestionBtn = document.getElementById('getPriceSuggestion');
  const aiPriceSuggestionDiv = document.getElementById('aiPriceSuggestion');
  const useSuggestedPriceBtn = document.getElementById('useSuggestedPrice');
  
  let currentPrediction = null;
  
  if (getPriceSuggestionBtn) {
    getPriceSuggestionBtn.addEventListener('click', async () => {
      const category = document.getElementById('category').value.trim();
      const condition = document.getElementById('condition').value.trim();
      const title = document.getElementById('title').value.trim();
      const description = document.getElementById('description').value.trim();
      const userPrice = parseFloat(document.getElementById('price').value) || 0;
      
      if (!category || !condition) {
        alert('Please enter Category and Condition first for accurate AI prediction!');
        return;
      }
      
      // Show loading state
      aiPriceSuggestionDiv.style.display = 'block';
      document.getElementById('aiPredictedPrice').textContent = '₹...';
      document.getElementById('aiConfidence').textContent = '🤖 Analyzing market data...';
      document.getElementById('aiPriceRange').textContent = 'Researching prices on OLX, Amazon, Flipkart...';
      document.getElementById('aiReasoning').textContent = 'Please wait while AI researches current market prices...';
      getPriceSuggestionBtn.disabled = true;
      getPriceSuggestionBtn.textContent = '⏳ AI Analyzing...';
      
      try {
        const response = await fetch(`${API_BASE}/api/predict-price`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category,
            condition,
            title,
            description,
            userPrice
          })
        });
        
        const data = await response.json();
        
        if (data.success && data.prediction) {
          currentPrediction = data.prediction;
          const { predicted, lower, upper, confidence, reasoning } = data.prediction;
          
          document.getElementById('aiPredictedPrice').textContent = `₹${predicted.toLocaleString()}`;
          document.getElementById('aiConfidence').textContent = `${confidence} confidence`;
          document.getElementById('aiPriceRange').textContent = `Fair range: ₹${lower.toLocaleString()} - ₹${upper.toLocaleString()}`;
          document.getElementById('aiReasoning').textContent = reasoning;
          
          // Change button color based on confidence
          const confColor = confidence === 'high' ? '#10b981' : confidence === 'medium' ? '#f59e0b' : '#6b7280';
          document.getElementById('aiConfidence').style.color = confColor;
          document.getElementById('aiConfidence').style.fontWeight = 'bold';
        } else {
          document.getElementById('aiReasoning').textContent = data.message || 'Failed to get price prediction. Please try again.';
        }
      } catch (error) {
        console.error('Price prediction error:', error);
        document.getElementById('aiReasoning').textContent = 'Error getting AI prediction. Please check your connection and try again.';
      } finally {
        getPriceSuggestionBtn.disabled = false;
        getPriceSuggestionBtn.textContent = '🤖 Get AI Price Suggestion';
      }
    });
  }
  
  if (useSuggestedPriceBtn) {
    useSuggestedPriceBtn.addEventListener('click', () => {
      if (currentPrediction && currentPrediction.predicted) {
        document.getElementById('price').value = currentPrediction.predicted;
        alert(`✅ Price updated to ₹${currentPrediction.predicted.toLocaleString()} (AI suggestion)`);
      }
    });
  }

  document.getElementById("productForm").addEventListener("submit", addProduct);
 // Sold items nav button
  const soldNav = document.getElementById('soldNavBtn');
  if (soldNav) soldNav.addEventListener('click', async () => { await showSoldItems(); });
  // Wishlist nav button
  const wishlistNav = document.getElementById('wishlistNavBtn');
  if (wishlistNav) wishlistNav.addEventListener('click', async () => {
    const modal = document.getElementById('wishlistModal');
    const container = document.getElementById('wishlistContainer');
    container.innerHTML = '';
    try {
      const res = await fetch(`${API_BASE}/api/wishlist`, { credentials: 'include' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // Instead of alert, show the wishlist modal with a login CTA
        container.innerHTML = `
          <div style="padding:1rem;text-align:center;">
            <p style="font-weight:600;margin-bottom:8px;">${(body.error) ? body.error : 'Please login to view wishlist'}</p>
            <button id="gotoLoginFromWishlist" class="add-btn">Login</button>
          </div>`;
        modal.style.display = 'flex';
        document.getElementById('gotoLoginFromWishlist').onclick = () => { window.location.href = '/login.html'; };
        document.getElementById('closeWishlist').onclick = () => { modal.style.display = 'none'; };
        return;
      }
      const data = await res.json();
      const items = data.items || [];
      if (items.length === 0) container.innerHTML = '<p>No items in wishlist</p>';
      items.forEach((it) => {
        const c = document.createElement('div');
        c.className = 'product-card';
        c.innerHTML = `
          <h3>${it.title}</h3>
          <p><strong>Price:</strong> ₹${it.price}</p>
          <p>${it.description || ''}</p>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
            <button class="buy-btn" onclick="showDetails(${it.product_id})">Details</button>
            <button class="delete-btn" onclick="(async ()=>{ const r=await fetch('${API_BASE}/api/wishlist/${it.product_id}',{method:'DELETE',credentials:'include'}); if(r.ok){ alert('Removed'); c.remove(); } else { const b=await r.json().catch(()=>({})); alert(b.error||b.message||'Failed'); } })()">Remove</button>
          </div>
        `;
        container.appendChild(c);
      });
      modal.style.display = 'flex';
      document.getElementById('closeWishlist').onclick = () => { modal.style.display = 'none'; };
    } catch (err) {
      console.error('Fetch wishlist failed', err);
      alert('Failed to load wishlist');
    }
  });

  // Messages nav button
  const messagesNav = document.getElementById('messagesBtn');
  if (messagesNav) messagesNav.addEventListener('click', async () => {
    await openMessages();
  });

  // My Reviews nav button - shows reviews the seller received
  const myReviewsNav = document.getElementById('myReviewsBtn');
  if (myReviewsNav) myReviewsNav.addEventListener('click', async () => {
    await fetchCurrentUser();
    if (!currentUser) {
      alert('Please log in to view your reviews');
      return;
    }
    // Call viewSellerReviews with current user's ID
    await viewSellerReviews(currentUser.user_id, currentUser.name || 'You');
  });

  // Floating Action Buttons
  const fabAdd = document.getElementById('fabAdd');
  if (fabAdd) fabAdd.addEventListener('click', () => document.getElementById('addProductBtn')?.click());
  const fabWishlist = document.getElementById('fabWishlist');
  if (fabWishlist) fabWishlist.addEventListener('click', () => document.getElementById('wishlistNavBtn')?.click());
  const fabMessages = document.getElementById('fabMessages');
  if (fabMessages) fabMessages.addEventListener('click', () => document.getElementById('messagesBtn')?.click());
});

// Global handler for Book button (reads dataset.productId)
document.addEventListener('click', async (e) => {
  const target = e.target;
  if (!target) return;
  if (target.id === 'bookProduct') {
    e.stopPropagation();
    const pid = target.dataset.productId;
    if (!pid) return alert('Product context missing. Open details again.');
    // ensure current user
    await fetchCurrentUser();
    if (!currentUser) return window.location.href = '/login.html';
    try {
      const res = await fetch(`${API_BASE}/api/products/${pid}/book`, { method: 'POST', credentials: 'include' });
      const text = await res.text();
      let body; try { body = JSON.parse(text); } catch (e) { body = { raw: text }; }
      console.debug('global book response', res.status, body);
      if (res.ok) {
        alert(body.message || 'Product booked');
        // refresh list
        await loadProducts();
      } else {
        alert(body.error || body.message || (body.raw || 'Failed to book'));
      }
    } catch (err) {
      console.error('Global book error', err);
      alert('Network error while booking');
    }
  }
  if (target.id === 'wishlistProduct') {
    e.stopPropagation();
    const pid = target.dataset.productId;
    await fetchCurrentUser();
    if (!currentUser) return window.location.href = '/login.html';
    if (!pid) return alert('Product context missing. Open details again.');
    try {
      // determine state by fetching wishlist and checking
      const wres = await fetch(`${API_BASE}/api/wishlist`, { credentials: 'include' });
      if (!wres.ok) { const b = await wres.json().catch(()=>({})); return alert(b.error||b.message||'Failed to get wishlist'); }
      const wdata = await wres.json();
      const inWishlist = (wdata.items||[]).some(i=>i.product_id == pid);
      if (!inWishlist) {
        const r = await fetch(`${API_BASE}/api/wishlist`, { method: 'POST', headers: {'Content-Type':'application/json'}, credentials: 'include', body: JSON.stringify({ product_id: pid }) });
        const t = await r.text(); let b; try { b = JSON.parse(t); } catch(e){ b={raw:t}; }
        if (r.ok) { alert(b.message||'Added to wishlist'); target.innerText = 'Remove from Wishlist'; }
        else alert(b.error||b.message||(b.raw||'Failed to add'));
      } else {
        const r = await fetch(`${API_BASE}/api/wishlist/${pid}`, { method: 'DELETE', credentials: 'include' });
        const t = await r.text(); let b; try { b = JSON.parse(t); } catch(e){ b={raw:t}; }
        if (r.ok) { alert(b.message||'Removed from wishlist'); target.innerText = 'Add to Wishlist'; }
        else alert(b.error||b.message||(b.raw||'Failed to remove'));
      }
    } catch (err) { console.error('Global wishlist error', err); alert('Network error'); }
  }
});

// Open Messages modal and load messages
async function openMessages() {
  const modal = document.getElementById('messagesModal');
  const list = document.getElementById('messagesList');
  const detail = document.getElementById('messageDetail');
  list.innerHTML = '';
  detail.style.display = 'none';
  try {
    const res = await fetch(`${API_BASE}/api/messages`, { credentials: 'include' });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      list.innerHTML = `<div style="padding:1rem;text-align:center;"><p style="font-weight:600;margin-bottom:8px;">${b.error || 'Please login to view messages'}</p><button class="add-btn" onclick="window.location.href='/login.html'">Login</button></div>`;
      modal.style.display = 'flex';
      document.getElementById('closeMessages').onclick = () => { modal.style.display = 'none'; };
      return;
    }
    const data = await res.json();
    const messages = data.messages || [];
    if (messages.length === 0) list.innerHTML = '<p>No messages</p>';
    messages.forEach(m => {
      const item = document.createElement('div');
      item.className = 'product-card';
      item.style.padding = '10px';
      item.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <strong>${m.sender_name || 'Someone'}</strong>
            <div style="font-size:0.9rem;color:var(--card-text);">${m.item_title ? 'Regarding: ' + m.item_title : ''}</div>
            <div style="margin-top:6px;color:var(--card-text);">${(m.message_text||'').slice(0,120)}${(m.message_text||'').length>120? '...':''}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
            <button class="add-btn" onclick="showMessage(${m.message_id})">View</button>
          </div>
        </div>
      `;
      list.appendChild(item);
    });
    modal.style.display = 'flex';
    document.getElementById('closeMessages').onclick = () => { modal.style.display = 'none'; };
  } catch (err) {
    console.error('Failed to load messages', err);
    list.innerHTML = '<p>Error loading messages</p>';
    modal.style.display = 'flex';
    document.getElementById('closeMessages').onclick = () => { modal.style.display = 'none'; };
  }
}

// Show single message details
async function showMessage(id) {
  try {
    const res = await fetch(`${API_BASE}/api/messages/${id}`, { credentials: 'include' });
    if (!res.ok) return alert('Failed to fetch message');
    const data = await res.json();
    const m = data.message;
    const detail = document.getElementById('messageDetail');
    detail.style.display = 'block';
    detail.innerHTML = `
      <h3 style="margin:0 0 6px 0;">From: ${m.sender_name || 'Unknown'}</h3>
      <div style="color:var(--card-text);margin-bottom:6px;">Email: ${m.sender_email || 'N/A'}</div>
      <div style="color:var(--card-text);white-space:pre-wrap;margin-bottom:12px;">${m.message_text || ''}</div>
      <div style="border-top:1px solid rgba(0,0,0,0.1);padding-top:12px;margin-top:12px;">
        <textarea id="replyText_${id}" placeholder="Type your reply..." style="width:100%;min-height:80px;padding:8px;border:1px solid rgba(0,0,0,0.15);border-radius:6px;resize:vertical;"></textarea>
        <button onclick="sendReply(${m.sender_id}, ${m.item_id || 'null'}, '${(m.sender_name || '').replace(/'/g, "\\'")}', ${id})" class="add-btn" style="margin-top:8px;">Send Reply</button>
      </div>
    `;
    // Optionally scroll to detail
    detail.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (err) {
    console.error('Show message error', err);
    alert('Error loading message');
  }
}

// Send reply to a message
async function sendReply(receiverId, itemId, receiverName, originalMessageId) {
  const replyText = document.getElementById(`replyText_${originalMessageId}`).value.trim();
  if (!replyText) {
    alert('Please enter a reply message');
    return;
  }
  
  try {
    const res = await fetch(`${API_BASE}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        receiver_id: receiverId,
        item_id: itemId,
        message_text: replyText
      })
    });
    
    if (res.ok) {
      alert(`Reply sent to ${receiverName}`);
      document.getElementById(`replyText_${originalMessageId}`).value = '';
      document.getElementById('messageDetail').style.display = 'none';
    } else {
      const errData = await res.json().catch(() => ({}));
      alert(errData.error || 'Failed to send reply');
    }
  } catch (err) {
    console.error('Send reply error', err);
    alert('Network error while sending reply');
  }
}

// Show product + seller details in modal
async function showDetails(productId) {
  try {
    await fetchCurrentUser();
    const res = await fetch(`${API_BASE}/api/products/${productId}`);
    if (!res.ok) return alert('Could not fetch product details');
    const data = await res.json();
    const p = data.product;

    // Basic field population
    document.getElementById('productTitle').innerText = p.title || 'Product';
    document.getElementById('productCategory').innerText = `Category: ${p.category || 'N/A'}`;
    document.getElementById('productPrice').innerText = `Price: ₹${p.price}`;
    document.getElementById('productCondition').innerText = `Condition: ${p.condition || 'N/A'}`;
    document.getElementById('productStock').innerText = `Stock: ${p.quantity || 0} available`;
    document.getElementById('productDescription').innerText = p.description || '';
    document.getElementById('sellerName').innerText = p.seller_name || 'Seller';
    document.getElementById('sellerEmail').innerText = p.seller_email || '';
    document.getElementById('sellerPhone').innerText = p.seller_phone || '';

    // Images (prefix if needed)
    const prefix = (path) => path && path.startsWith('/uploads') ? (API_BASE + path) : path;
    const img1 = document.getElementById('productImage1');
    const img2 = document.getElementById('productImage2');
    const img3 = document.getElementById('productImage3');
    if (img1){ img1.src = prefix(p.image1 || ''); img1.style.display = p.image1 ? 'block':'none'; }
    if (img2){ img2.src = prefix(p.image2 || ''); img2.style.display = p.image2 ? 'block':'none'; }
    if (img3){ img3.src = prefix(p.image3 || ''); img3.style.display = p.image3 ? 'block':'none'; }

    // Simple image zoom
    const zoomModal = document.getElementById('imageZoomModal');
    const zoomedImage = document.getElementById('zoomedImage');
    [img1,img2,img3].forEach(im => {
      if (im) {
        im.onclick = () => { if (!im.src) return; zoomedImage.src = im.src; zoomModal.style.display = 'flex'; };
      }
    });
    if (zoomModal) zoomModal.onclick = (e)=>{ if (e.target === zoomModal) zoomModal.style.display='none'; };

    // Show modal
    const modal = document.getElementById('sellerModal');
    modal.style.display = 'flex';

    // Buttons
    const closeBtn = document.getElementById('closeSeller');
    if (closeBtn) closeBtn.onclick = () => { modal.style.display='none'; };
    const msgBtn = document.getElementById('messageSeller');
    if (msgBtn) {
      msgBtn.onclick = async () => {
        const txt = prompt('Enter message to seller:');
        if (!txt) return;
        const r = await fetch(`${API_BASE}/api/messages`, {
          method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
          body: JSON.stringify({ item_id: p.product_id, receiver_id: p.seller_id, message_text: txt })
        });
        if (r.ok) alert('Message sent'); else alert('Failed to send');
      };
    }

    const bookBtn = document.getElementById('bookProduct');
    if (bookBtn) {
      const isSold = p.status && p.status.toLowerCase()==='sold';
      if (!isSold && currentUser && currentUser.user_id !== p.seller_id) {
        bookBtn.style.display='inline-block';
        bookBtn.dataset.productId = p.product_id;
      } else {
        bookBtn.style.display='none';
      }
    }

    const wishlistBtn = document.getElementById('wishlistProduct');
    if (wishlistBtn) {
      if (currentUser && currentUser.user_id !== p.seller_id) {
        wishlistBtn.style.display='inline-block';
        wishlistBtn.dataset.productId = p.product_id;
      } else {
        wishlistBtn.style.display='none';
      }
    }
  } catch (err) {
    console.error('Details fetch error', err);
    alert('Error loading details');
  }
}

// ============ REVIEW FUNCTIONS ============
// Open review modal
function openReviewModal(sellerId, productId, sellerName) {
  console.log('openReviewModal called with:', { sellerId, productId, sellerName });
  
  document.getElementById('reviewSellerId').value = sellerId;
  document.getElementById('reviewProductId').value = productId;
  document.getElementById('ratingValue').value = '';
  document.getElementById('reviewText').value = '';
  
  // Reset stars
  document.querySelectorAll('.star').forEach(s => s.innerText = '☆');
  
  const modal = document.getElementById('reviewModal');
  modal.style.display = 'flex';
  
  document.getElementById('cancelReview').onclick = () => modal.style.display = 'none';
}

// Handle star rating clicks
document.addEventListener('DOMContentLoaded', () => {
  const stars = document.querySelectorAll('.star');
  stars.forEach(star => {
    star.addEventListener('click', function() {
      const value = parseInt(this.dataset.value);
      document.getElementById('ratingValue').value = value;
      
      // Update star display
      stars.forEach((s, idx) => {
        s.innerText = idx < value ? '★' : '☆';
      });
    });
  });
  
  // Handle review form submission
  document.getElementById('reviewForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const sellerId = parseInt(document.getElementById('reviewSellerId').value);
    const productId = parseInt(document.getElementById('reviewProductId').value);
    const rating = parseInt(document.getElementById('ratingValue').value);
    const reviewText = document.getElementById('reviewText').value;
    
    console.log('Review form data:', { sellerId, productId, rating, reviewText });
    
    if (!rating || rating < 1 || rating > 5) {
      alert('Please select a rating (1-5 stars)');
      return;
    }
    
    if (!sellerId) {
      alert('Seller ID missing - please try again');
      return;
    }
    
    try {
      const payload = {
        seller_id: sellerId,
        product_id: productId,
        rating: rating,
        review_text: reviewText || ''
      };
      
      console.log('Sending review:', payload);
      
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Review submitted successfully!');
        document.getElementById('reviewModal').style.display = 'none';
      } else {
        alert(data.error || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Review submission error', err);
      alert('Network error while submitting review');
    }
  });
});

// View seller reviews
async function viewSellerReviews(sellerId, sellerName) {
  try {
    const res = await fetch(`${API_BASE}/api/reviews/${sellerId}`);
    if (!res.ok) {
      alert('Failed to load reviews');
      return;
    }
    
    const data = await res.json();
    const reviews = data.reviews || [];
    const avgRating = data.average_rating || 0;
    const total = data.total_reviews || 0;
    
    let reviewsHtml = `
      <h3>${sellerName}'s Reviews</h3>
      <div style="margin:12px 0;padding:12px;background:rgba(0,0,0,0.03);border-radius:8px;">
        <div style="font-size:1.5rem;font-weight:700;">⭐ ${avgRating} / 5</div>
        <div style="font-size:0.9rem;color:var(--card-text);">${total} review${total !== 1 ? 's' : ''}</div>
      </div>
    `;
    
    if (reviews.length === 0) {
      reviewsHtml += '<p style="text-align:center;color:var(--card-text);">No reviews yet</p>';
    } else {
      reviews.forEach(r => {
        const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
        reviewsHtml += `
          <div style="padding:12px;margin:8px 0;border-radius:8px;background:rgba(0,0,0,0.02);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <strong>${r.buyer_name || 'Anonymous'}</strong>
              <span style="font-size:1.2rem;">${stars}</span>
            </div>
            ${r.product_title ? `<div style="font-size:0.85rem;color:var(--card-text);margin-bottom:4px;">Product: ${r.product_title}</div>` : ''}
            ${r.review_text ? `<div style="margin-top:6px;color:var(--card-text);">${r.review_text}</div>` : ''}
            <div style="font-size:0.75rem;color:#999;margin-top:6px;">${new Date(r.created_at).toLocaleDateString()}</div>
          </div>
        `;
      });
    }
    
    // Show in alert (or you can create a dedicated reviews modal)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = reviewsHtml;
    tempDiv.style.cssText = 'max-height:80vh;overflow-y:auto;padding:1rem;';
    
    // Use a simple modal approach
    const existingReviewsModal = document.getElementById('viewReviewsModal');
    if (existingReviewsModal) {
      existingReviewsModal.querySelector('.modal-content').innerHTML = reviewsHtml + '<button class="cancel-btn" onclick="document.getElementById(\'viewReviewsModal\').style.display=\'none\'">Close</button>';
      existingReviewsModal.style.display = 'flex';
    } else {
      // Create a temp modal
      const modal = document.createElement('div');
      modal.id = 'viewReviewsModal';
      modal.className = 'modal';
      modal.style.display = 'flex';
      modal.innerHTML = `<div class="modal-content" style="width:600px;max-height:85vh;overflow-y:auto;">${reviewsHtml}<button class="cancel-btn" onclick="this.closest('.modal').remove()">Close</button></div>`;
      document.body.appendChild(modal);
      modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    }
  } catch (err) {
    console.error('Failed to load reviews', err);
    alert('Error loading reviews');
  }
}



