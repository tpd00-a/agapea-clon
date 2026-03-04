/**
 * ============================================================
 * AGAPEA CLONE - app.js
 * Librería Online - Lenguaje de Marcas
 * ============================================================
 * Módulos:
 *  - Cart       → carrito con localStorage
 *  - Favorites  → favoritos con localStorage
 *  - UserModule → login/registro con localStorage
 *  - UI Index   → catálogo, filtros, paginación
 *  - UI Book    → ficha de libro
 *  - UI Cart    → página de carrito
 *  - UI Login   → formularios de autenticación
 * ============================================================
 */

// =============================================
// MÓDULO CARRITO
// =============================================
const Cart = {
  KEY: 'agapea_cart',

  getAll() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch { return []; }
  },

  save(items) {
    localStorage.setItem(this.KEY, JSON.stringify(items));
    this.updateHeaderBadge();
  },

  add(book, qty = 1) {
    const items = this.getAll();
    const idx = items.findIndex(i => i.id === book.id);
    if (idx > -1) {
      items[idx].qty = Math.min(items[idx].qty + qty, book.stock || 99);
    } else {
      items.push({
        id: book.id,
        title: book.title,
        author: book.author,
        price: book.price,
        cover: book.cover || '',
        stock: book.stock || 99,
        qty
      });
    }
    this.save(items);
  },

  remove(id) {
    const items = this.getAll().filter(i => i.id !== id);
    this.save(items);
  },

  updateQty(id, qty) {
    const items = this.getAll();
    const item = items.find(i => i.id === id);
    if (item) {
      if (qty < 1) { this.remove(id); return; }
      item.qty = Math.min(qty, item.stock || 99);
      this.save(items);
    }
  },

  clear() {
    localStorage.removeItem(this.KEY);
    this.updateHeaderBadge();
  },

  count() {
    return this.getAll().reduce((s, i) => s + i.qty, 0);
  },

  total() {
    return this.getAll().reduce((s, i) => s + i.price * i.qty, 0);
  },

  updateHeaderBadge() {
    const badge = document.getElementById('cart-badge');
    const totalEl = document.getElementById('cart-header-total');
    if (badge) badge.textContent = this.count();
    if (totalEl) totalEl.textContent = formatPrice(this.total());
  }
};

// =============================================
// MÓDULO FAVORITOS
// =============================================
const Favorites = {
  KEY: 'agapea_favorites',

  getAll() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch { return []; }
  },

  has(id) {
    return this.getAll().includes(id);
  },

  toggle(id) {
    let favs = this.getAll();
    if (favs.includes(id)) {
      favs = favs.filter(f => f !== id);
    } else {
      favs.push(id);
    }
    localStorage.setItem(this.KEY, JSON.stringify(favs));
    return favs.includes(id);
  }
};

// =============================================
// MÓDULO USUARIO
// =============================================
const UserModule = {
  KEY: 'agapea_user',

  get() {
    try { return JSON.parse(localStorage.getItem(this.KEY)); }
    catch { return null; }
  },

  isLoggedIn() { return !!this.get(); },

  login(email, password) {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === this._hash(password));
    if (user) {
      const { password: _, ...safe } = user;
      localStorage.setItem(this.KEY, JSON.stringify(safe));
      return { ok: true, user: safe };
    }
    return { ok: false, msg: 'Email o contraseña incorrectos' };
  },

  register(data) {
    const users = this.getUsers();
    if (users.find(u => u.email === data.email)) {
      return { ok: false, msg: 'Ya existe una cuenta con ese email' };
    }
    const user = {
      id: Date.now(),
      name: data.name,
      surname: data.surname,
      email: data.email,
      password: this._hash(data.password),
      newsletter: data.newsletter || false,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    localStorage.setItem('agapea_users', JSON.stringify(users));
    const { password: _, ...safe } = user;
    localStorage.setItem(this.KEY, JSON.stringify(safe));
    return { ok: true, user: safe };
  },

  logout() {
    localStorage.removeItem(this.KEY);
  },

  getUsers() {
    try { return JSON.parse(localStorage.getItem('agapea_users')) || []; }
    catch { return []; }
  },

  _hash(str) {
    // Simple hash para localStorage (no para producción real)
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return h.toString(16);
  },

  updateHeader() {
    const el = document.getElementById('header-user-name');
    if (!el) return;
    const user = this.get();
    if (user) {
      el.textContent = user.name;
    } else {
      el.textContent = 'Login';
    }
  }
};

// =============================================
// UTILIDADES
// =============================================
function formatPrice(n) {
  return n.toFixed(2).replace('.', ',') + ' €';
}

function renderStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) html += '<i class="fa-solid fa-star"></i>';
    else if (i - rating < 1 && i - rating > 0) html += '<i class="fa-solid fa-star-half-stroke"></i>';
    else html += '<i class="fa-regular fa-star"></i>';
  }
  return html;
}

function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fa-solid fa-${type === 'success' ? 'check' : type === 'error' ? 'xmark' : 'info'}-circle"></i>
    ${msg}
  `;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

// =============================================
// UI GLOBAL - Inicialización común
// =============================================
function initGlobal() {
  Cart.updateHeaderBadge();
  UserModule.updateHeader();
}

function buscarDesdeCabecera() {
  const q = document.getElementById('header-search')?.value.trim();
  if (q) {
    window.location.href = `index.html?q=${encodeURIComponent(q)}`;
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.activeElement?.id === 'header-search') {
    buscarDesdeCabecera();
  }
});

// =============================================
// UI INDEX - Catálogo principal
// =============================================
const ITEMS_PER_PAGE = 8;
let allBooks = [];
let filteredBooks = [];
let currentPage = 1;

async function loadBooks() {
  try {
    const r = await fetch('data/books.json');
    if (!r.ok) throw new Error('Error cargando datos');
    return await r.json();
  } catch (e) {
    console.error(e);
    return [];
  }
}

function applyFiltersAndSort() {
  const search = document.getElementById('search-input')?.value.toLowerCase().trim() || '';
  const cat = document.getElementById('category-filter')?.value || '';
  const sort = document.getElementById('sort-select')?.value || 'relevance';

  filteredBooks = allBooks.filter(b => {
    const matchSearch = !search ||
      b.title.toLowerCase().includes(search) ||
      b.author.toLowerCase().includes(search) ||
      (b.isbn && b.isbn.includes(search)) ||
      (b.tags && b.tags.some(t => t.toLowerCase().includes(search)));
    const matchCat = !cat || b.category === cat || b.genre === cat;
    return matchSearch && matchCat;
  });

  filteredBooks.sort((a, b) => {
    switch (sort) {
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'rating': return (b.rating || 0) - (a.rating || 0);
      case 'date': return (b.year || 0) - (a.year || 0);
      case 'title': return a.title.localeCompare(b.title);
      default: return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    }
  });

  currentPage = 1;
  renderPage();
}

function renderPage() {
  const container = document.getElementById('games-container');
  const countEl = document.getElementById('results-count');
  const loadingEl = document.getElementById('loading-state');
  if (!container) return;

  if (loadingEl) loadingEl.style.display = 'none';
  container.style.display = 'grid';

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageBooks = filteredBooks.slice(start, start + ITEMS_PER_PAGE);

  if (countEl) {
    countEl.textContent = filteredBooks.length
      ? `${filteredBooks.length} resultado${filteredBooks.length !== 1 ? 's' : ''} encontrado${filteredBooks.length !== 1 ? 's' : ''}`
      : '';
  }

  if (pageBooks.length === 0) {
    container.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:40px; color:#888">
        <i class="fa-solid fa-magnifying-glass" style="font-size:40px; margin-bottom:15px; display:block; color:#ddd"></i>
        No se encontraron libros con esos criterios.
        <br><a href="index.html" style="color:#00679f; margin-top:10px; display:inline-block">Ver todos los libros</a>
      </div>`;
    renderPagination();
    return;
  }

  container.innerHTML = pageBooks.map(b => bookCardHTML(b)).join('');
  renderPagination();
}

function bookCardHTML(b) {
  const isFav = Favorites.has(b.id);
  const discount = b.discount ? `<div class="badge-discount">-${b.discount}%</div>` : '';
  const badge = b.newRelease ? '<div class="badge-new">Nuevo</div>' : b.bestseller ? '<div class="badge-best">Bestseller</div>' : '';

  return `
    <div class="bookcase-item">
      <a href="book.html?id=${b.id}" class="book-link">
        <figure>
          ${discount}${badge}
          <img src="${b.cover || 'https://via.placeholder.com/120x160/e8e8e8/888?text=Sin+portada'}"
               alt="${b.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/120x160/e8e8e8/888?text=Sin+portada'">
        </figure>
        <div class="book-info">
          <div class="book-title" title="${b.title}">${b.title}</div>
          <div class="book-author">${b.author}</div>
          <div class="book-stars">${renderStars(b.rating || 0)}</div>
          <div class="book-price-wrap">
            <span class="book-price">${formatPrice(b.price)}</span>
            ${b.originalPrice && b.originalPrice > b.price
              ? `<span class="book-orig-price">${formatPrice(b.originalPrice)}</span>` : ''}
          </div>
        </div>
      </a>
      <div class="book-actions">
        <button class="botpeq" onclick="addFromCard(${b.id})">
          <i class="fa-solid fa-cart-plus"></i> Añadir
        </button>
        <button class="btn-fav-card ${isFav ? 'active' : ''}" onclick="toggleFavCard(${b.id}, this)" title="${isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}">
          <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
        </button>
      </div>
    </div>`;
}

function renderPagination() {
  const pagEl = document.getElementById('pagination');
  if (!pagEl) return;
  const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE);
  if (totalPages <= 1) { pagEl.innerHTML = ''; return; }

  let html = '';
  if (currentPage > 1) html += `<button onclick="goToPage(${currentPage - 1})">‹ Anterior</button>`;

  const range = 2;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= range) {
      html += `<button class="${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    } else if (Math.abs(i - currentPage) === range + 1) {
      html += `<span class="pag-dots">…</span>`;
    }
  }

  if (currentPage < totalPages) html += `<button onclick="goToPage(${currentPage + 1})">Siguiente ›</button>`;
  pagEl.innerHTML = html;
}

function goToPage(n) {
  currentPage = n;
  renderPage();
  document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function addFromCard(id) {
  const book = allBooks.find(b => b.id === id);
  if (!book) return;
  Cart.add(book);
  showToast(`"${book.title.substring(0, 30)}..." añadido al carrito`);
}

function toggleFavCard(id, btn) {
  const isNowFav = Favorites.toggle(id);
  btn.classList.toggle('active', isNowFav);
  const icon = btn.querySelector('i');
  if (icon) icon.className = `fa-${isNowFav ? 'solid' : 'regular'} fa-heart`;
  showToast(isNowFav ? 'Añadido a favoritos' : 'Eliminado de favoritos', isNowFav ? 'success' : 'info');
}

function initSidebarCats() {
  document.querySelectorAll('#sidebar-cats a[data-cat]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('#sidebar-cats a').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      const cat = link.dataset.cat;
      const catSel = document.getElementById('category-filter');
      if (catSel) catSel.value = cat === 'all' ? '' : cat;
      applyFiltersAndSort();
    });
  });
}

// =============================================
// UI BOOK - Ficha de libro
// =============================================
let currentBook = null;

async function initBookPage() {
  const id = parseInt(new URLSearchParams(location.search).get('id'));
  if (!id) { window.location.href = 'index.html'; return; }

  const books = await loadBooks();
  allBooks = books;
  currentBook = books.find(b => b.id === id);

  if (!currentBook) {
    document.getElementById('loading-state').innerHTML = '<p>Libro no encontrado. <a href="index.html">Volver al catálogo</a></p>';
    return;
  }

  renderFicha(currentBook);
  renderRelated(books, currentBook);
}

function renderFicha(b) {
  document.getElementById('loading-state').style.display = 'none';
  const ficha = document.getElementById('ficha-libro');
  ficha.style.display = 'flex';

  document.title = `${b.title} - Librería Agapea`;
  document.getElementById('breadcrumb-cat').textContent = b.genre || b.category || 'Libros';
  document.getElementById('breadcrumb-title').textContent = b.title.length > 40 ? b.title.substring(0, 40) + '...' : b.title;

  document.getElementById('ficha-cover').src = b.cover || 'https://via.placeholder.com/200x280/e8e8e8/888?text=Sin+portada';
  document.getElementById('ficha-cover').alt = b.title;
  document.getElementById('ficha-title').textContent = b.title;
  document.getElementById('ficha-author').textContent = b.author;
  document.getElementById('ficha-stars').innerHTML = renderStars(b.rating || 0);
  document.getElementById('ficha-rating-num').textContent = b.rating ? `${b.rating}/5` : '';
  document.getElementById('ficha-reviews').textContent = b.reviews ? `(${b.reviews} valoraciones)` : '';
  document.getElementById('ficha-price').textContent = formatPrice(b.price);

  if (b.originalPrice && b.originalPrice > b.price) {
    document.getElementById('ficha-orig-price').textContent = formatPrice(b.originalPrice);
    document.getElementById('ficha-discount').textContent = `-${b.discount}%`;
  }

  const stockEl = document.getElementById('ficha-stock-info');
  if (b.stock > 5) {
    stockEl.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#27ae60"></i> En stock - Disponible';
    stockEl.style.color = '#27ae60';
  } else if (b.stock > 0) {
    stockEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color:#e67e22"></i> Últimas ${b.stock} unidades`;
    stockEl.style.color = '#e67e22';
  } else {
    stockEl.innerHTML = '<i class="fa-solid fa-circle-xmark" style="color:#e74c3c"></i> Sin stock';
    stockEl.style.color = '#e74c3c';
    document.getElementById('btn-add-cart').disabled = true;
  }

  // Badges
  const badgesEl = document.getElementById('ficha-badges');
  if (badgesEl) {
    let badgesHTML = '';
    if (b.newRelease) badgesHTML += '<span class="badge-new">Novedad</span>';
    if (b.bestseller) badgesHTML += '<span class="badge-best">Bestseller</span>';
    if (b.discount) badgesHTML += `<span class="badge-discount">-${b.discount}%</span>`;
    badgesEl.innerHTML = badgesHTML;
  }

  document.getElementById('ficha-description').textContent = b.description || 'No hay descripción disponible.';

  // Tabla detalles
  const rows = [
    ['ISBN', b.isbn],
    ['Autor', b.author],
    ['Editorial', b.publisher],
    ['Año', b.year],
    ['Páginas', b.pages],
    ['Idioma', b.language],
    ['Categoría', b.genre || b.category],
  ].filter(r => r[1]);

  const tablaHTML = rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('');
  const tablaEl = document.getElementById('tabla-detalles-full');
  if (tablaEl) tablaEl.innerHTML = tablaHTML;

  // Favorito
  updateFavBtn(b.id);

  // Mostrar form de valoración si está logueado
  if (UserModule.isLoggedIn()) {
    const formWrap = document.getElementById('review-form-wrap');
    if (formWrap) formWrap.style.display = 'block';
  }
}

function renderRelated(books, current) {
  const related = books.filter(b => b.id !== current.id &&
    (b.category === current.category || b.genre === current.genre)).slice(0, 4);
  if (!related.length) return;
  const section = document.getElementById('related-section');
  const container = document.getElementById('related-books');
  if (section && container) {
    section.style.display = 'block';
    container.innerHTML = related.map(b => bookCardHTML(b)).join('');
  }
}

function addToCartFromFicha() {
  if (!currentBook) return;
  const qty = parseInt(document.getElementById('qty-input')?.value) || 1;
  Cart.add(currentBook, qty);
  showToast(`${qty}x "${currentBook.title.substring(0, 25)}..." añadido al carrito`);
}

function changeQty(delta) {
  const input = document.getElementById('qty-input');
  if (!input) return;
  const newVal = Math.max(1, Math.min(99, parseInt(input.value) + delta));
  input.value = newVal;
}

function toggleFavFromFicha() {
  if (!currentBook) return;
  const isNowFav = Favorites.toggle(currentBook.id);
  updateFavBtn(currentBook.id);
  showToast(isNowFav ? 'Añadido a favoritos' : 'Eliminado de favoritos', isNowFav ? 'success' : 'info');
}

function updateFavBtn(id) {
  const btn = document.getElementById('btn-fav');
  const icon = document.getElementById('fav-icon');
  const text = document.getElementById('fav-text');
  if (!btn) return;
  const isFav = Favorites.has(id);
  btn.classList.toggle('active', isFav);
  if (icon) icon.className = `fa-${isFav ? 'solid' : 'regular'} fa-heart`;
  if (text) text.textContent = isFav ? 'En favoritos' : 'Añadir a favoritos';
}

function switchTab(btn, panelId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add('active');
}

function submitReview() {
  const text = document.getElementById('review-text')?.value.trim();
  if (!text) { showToast('Por favor escribe tu opinión', 'error'); return; }
  showToast('¡Gracias por tu valoración!');
  document.getElementById('review-text').value = '';
}

// =============================================
// UI CART - Página de carrito
// =============================================
function initCartPage() {
  renderCartPage();
}

function renderCartPage() {
  const items = Cart.getAll();
  const emptyEl = document.getElementById('empty-cart');
  const contentEl = document.getElementById('cart-content');
  const couponEl = document.getElementById('coupon-section');

  if (items.length === 0) {
    if (emptyEl) emptyEl.style.display = 'flex';
    if (contentEl) contentEl.style.display = 'none';
    if (couponEl) couponEl.style.display = 'none';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (contentEl) contentEl.style.display = 'flex';
  if (couponEl) couponEl.style.display = 'block';

  // Render items
  const listEl = document.getElementById('cart-items-list');
  if (listEl) {
    listEl.innerHTML = items.map(item => `
      <div class="cart-item" id="cart-item-${item.id}">
        <a href="book.html?id=${item.id}" class="cart-item-cover">
          <img src="${item.cover || 'https://via.placeholder.com/70x95/e8e8e8/888'}"
               alt="${item.title}" onerror="this.src='https://via.placeholder.com/70x95/e8e8e8/888'">
        </a>
        <div class="cart-item-info">
          <a href="book.html?id=${item.id}" class="cart-item-title">${item.title}</a>
          <div class="cart-item-author">${item.author || ''}</div>
          <div class="cart-item-unit-price">${formatPrice(item.price)} / unidad</div>
        </div>
        <div class="cart-item-qty">
          <div class="qty-control">
            <button class="qty-btn" onclick="cartChangeQty(${item.id}, ${item.qty - 1})">−</button>
            <input type="number" value="${item.qty}" min="1" readonly>
            <button class="qty-btn" onclick="cartChangeQty(${item.id}, ${item.qty + 1})">+</button>
          </div>
        </div>
        <div class="cart-item-price">
          ${formatPrice(item.price * item.qty)}
        </div>
        <button class="cart-item-remove" onclick="cartRemove(${item.id})" title="Eliminar">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>`).join('');
  }

  // Summary
  const total = Cart.total();
  const shipping = total >= 19 ? 0 : 3.99;
  const qty = Cart.count();

  const qtyEl = document.getElementById('summary-qty');
  const subtotalEl = document.getElementById('summary-subtotal');
  const shippingEl = document.getElementById('summary-shipping');
  const totalEl = document.getElementById('summary-total');

  if (qtyEl) qtyEl.textContent = qty;
  if (subtotalEl) subtotalEl.textContent = formatPrice(total);
  if (shippingEl) shippingEl.textContent = shipping === 0 ? 'GRATIS' : formatPrice(shipping);
  if (totalEl) totalEl.textContent = formatPrice(total + shipping);
}

function cartChangeQty(id, newQty) {
  if (newQty < 1) {
    if (confirm('¿Eliminar este artículo del carrito?')) {
      Cart.remove(id);
    }
  } else {
    Cart.updateQty(id, newQty);
  }
  renderCartPage();
}

function cartRemove(id) {
  Cart.remove(id);
  renderCartPage();
  showToast('Artículo eliminado del carrito', 'info');
}

function procederCheckout() {
  const user = UserModule.get();
  if (!user) {
    showToast('Por favor, inicia sesión para continuar', 'error');
    setTimeout(() => window.location.href = 'login.html', 1500);
    return;
  }
  const orderNum = 'AGP-' + Date.now().toString().slice(-8);
  const modal = document.getElementById('order-modal');
  const numEl = document.getElementById('modal-order-num');
  if (modal) modal.style.display = 'flex';
  if (numEl) numEl.textContent = `Número de pedido: ${orderNum}`;
  Cart.clear();
  renderCartPage();
}

function cerrarModal() {
  const modal = document.getElementById('order-modal');
  if (modal) modal.style.display = 'none';
  window.location.href = 'index.html';
}

function aplicarCupon() {
  const code = document.getElementById('coupon-input')?.value.trim().toUpperCase();
  const msgEl = document.getElementById('coupon-msg');
  const validCodes = { 'AGAPEA10': 10, 'LIBROS5': 5 };
  if (validCodes[code]) {
    if (msgEl) msgEl.innerHTML = `<span style="color:#27ae60">✓ Cupón aplicado: ${validCodes[code]}% de descuento</span>`;
    showToast(`Cupón ${code} aplicado: -${validCodes[code]}%`);
  } else {
    if (msgEl) msgEl.innerHTML = `<span style="color:#e74c3c">✗ Código de descuento no válido</span>`;
  }
}

// =============================================
// UI LOGIN - Autenticación
// =============================================
function switchAuthTab(tab) {
  const loginWrap = document.getElementById('login-form-wrap');
  const regWrap = document.getElementById('register-form-wrap');
  const loginBtn = document.getElementById('tab-login-btn');
  const regBtn = document.getElementById('tab-register-btn');

  if (tab === 'login') {
    loginWrap.style.display = 'block';
    regWrap.style.display = 'none';
    loginBtn.classList.add('active');
    regBtn.classList.remove('active');
  } else {
    loginWrap.style.display = 'none';
    regWrap.style.display = 'block';
    loginBtn.classList.remove('active');
    regBtn.classList.add('active');
  }
}

function togglePass(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
  } else {
    input.type = 'password';
    btn.innerHTML = '<i class="fa-regular fa-eye"></i>';
  }
}

function validateField(input, errorId, rules) {
  const errorEl = document.getElementById(errorId);
  if (!errorEl) return true;
  const val = input.value.trim();

  for (const rule of rules) {
    if (!rule.check(val)) {
      input.classList.add('input-error');
      errorEl.textContent = rule.msg;
      return false;
    }
  }
  input.classList.remove('input-error');
  errorEl.textContent = '';
  return true;
}

function initLoginPage() {
  // Si ya está logueado, redirigir
  if (UserModule.isLoggedIn()) {
    const user = UserModule.get();
    showToast(`Bienvenido/a, ${user.name}!`);
    setTimeout(() => window.location.href = 'index.html', 1500);
    return;
  }

  // Check query param para tab inicial
  const params = new URLSearchParams(location.search);
  if (params.get('tab') === 'register') switchAuthTab('register');

  // Form LOGIN
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = document.getElementById('login-email');
      const pass = document.getElementById('login-password');
      let valid = true;

      valid &= validateField(email, 'login-email-err', [
        { check: v => v.length > 0, msg: 'El email es obligatorio' },
        { check: v => /^[^@]+@[^@]+\.[^@]+$/.test(v), msg: 'Email no válido' }
      ]);
      valid &= validateField(pass, 'login-pass-err', [
        { check: v => v.length > 0, msg: 'La contraseña es obligatoria' },
        { check: v => v.length >= 6, msg: 'Mínimo 6 caracteres' }
      ]);

      if (!valid) return;

      const result = UserModule.login(email.value.trim(), pass.value);
      if (result.ok) {
        Cart.updateHeaderBadge();
        UserModule.updateHeader();
        showToast(`¡Bienvenido/a, ${result.user.name}!`);
        setTimeout(() => window.location.href = 'index.html', 1200);
      } else {
        const errEl = document.getElementById('login-form-error');
        if (errEl) { errEl.textContent = result.msg; errEl.style.display = 'block'; }
      }
    });
  }

  // Form REGISTRO
  const regForm = document.getElementById('register-form');
  if (regForm) {
    const regPass = document.getElementById('reg-password');
    if (regPass) {
      regPass.addEventListener('input', () => {
        showPasswordStrength(regPass.value);
      });
    }

    regForm.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;

      valid &= validateField(document.getElementById('reg-name'), 'reg-name-err', [
        { check: v => v.length >= 2, msg: 'Nombre requerido (mín. 2 caracteres)' }
      ]);
      valid &= validateField(document.getElementById('reg-surname'), 'reg-surname-err', [
        { check: v => v.length >= 2, msg: 'Apellidos requeridos' }
      ]);
      valid &= validateField(document.getElementById('reg-email'), 'reg-email-err', [
        { check: v => v.length > 0, msg: 'El email es obligatorio' },
        { check: v => /^[^@]+@[^@]+\.[^@]+$/.test(v), msg: 'Email no válido' }
      ]);
      valid &= validateField(document.getElementById('reg-password'), 'reg-pass-err', [
        { check: v => v.length >= 6, msg: 'Mínimo 6 caracteres' }
      ]);

      const pass = document.getElementById('reg-password')?.value;
      const pass2 = document.getElementById('reg-password2');
      valid &= validateField(pass2, 'reg-pass2-err', [
        { check: v => v === pass, msg: 'Las contraseñas no coinciden' }
      ]);

      const terms = document.getElementById('reg-terms');
      const termsErr = document.getElementById('reg-terms-err');
      if (!terms?.checked) {
        if (termsErr) termsErr.textContent = 'Debes aceptar los términos y condiciones';
        valid = false;
      } else {
        if (termsErr) termsErr.textContent = '';
      }

      if (!valid) return;

      const result = UserModule.register({
        name: document.getElementById('reg-name').value.trim(),
        surname: document.getElementById('reg-surname').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        password: document.getElementById('reg-password').value,
        newsletter: document.getElementById('reg-newsletter')?.checked
      });

      if (result.ok) {
        Cart.updateHeaderBadge();
        UserModule.updateHeader();
        showToast(`¡Cuenta creada! Bienvenido/a, ${result.user.name}!`);
        setTimeout(() => window.location.href = 'index.html', 1200);
      } else {
        const errEl = document.getElementById('reg-form-error');
        if (errEl) { errEl.textContent = result.msg; errEl.style.display = 'block'; }
      }
    });
  }
}

function showPasswordStrength(password) {
  const el = document.getElementById('pass-strength');
  if (!el) return;
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ['', 'Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'];
  const colors = ['', '#e74c3c', '#e67e22', '#f39c12', '#27ae60', '#00679f'];
  el.innerHTML = password.length === 0 ? '' :
    `<div style="height:4px; background:#eee; border-radius:2px; margin-top:5px">
       <div style="height:100%; width:${score * 20}%; background:${colors[score]}; border-radius:2px; transition:all .3s"></div>
     </div>
     <small style="color:${colors[score]}">${labels[score]}</small>`;
}

function loginSocial(provider) {
  showToast(`Login con ${provider} no disponible en demo`, 'info');
}

// =============================================
// INICIALIZACIÓN POR PÁGINA
// =============================================
document.addEventListener('DOMContentLoaded', async () => {
  initGlobal();
  const page = location.pathname.split('/').pop() || 'index.html';

  if (page === 'index.html' || page === '' || page === '/') {
    // Página principal
    const books = await loadBooks();
    allBooks = books;
    filteredBooks = [...books];

    // Aplicar parámetros de URL
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    const cat = params.get('cat');

    if (q) {
      const input = document.getElementById('search-input');
      if (input) input.value = q;
    }
    if (cat) {
      const sel = document.getElementById('category-filter');
      if (sel) sel.value = cat;
    }

    applyFiltersAndSort();
    initSidebarCats();

    // Event listeners de filtros
    ['search-input', 'category-filter', 'sort-select'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener(id === 'search-input' ? 'input' : 'change', applyFiltersAndSort);
    });

    document.getElementById('search-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') applyFiltersAndSort();
    });

  } else if (page === 'book.html') {
    await initBookPage();

  } else if (page === 'cart.html') {
    initCartPage();

  } else if (page === 'login.html') {
    initLoginPage();
  }
});
