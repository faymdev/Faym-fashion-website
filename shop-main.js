/* shop-main.js - shared for shop, cart, checkout pages */

/* ---------- Utilities ---------- */
const API_ENDPOINT = 'https://fakestoreapi.com/products'; // fallback API
const MAX_PRODUCTS = 50;

function $$ (sel, ctx=document) { return Array.from((ctx||document).querySelectorAll(sel)); }
function $ (sel, ctx=document) { return (ctx||document).querySelector(sel); }

/* ---------- Cart (localStorage) ---------- */
const CART_KEY = 'faym_cart_v1';

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch(e) { return []; }
}
function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}
function updateCartBadge() {
  const count = readCart().reduce((s,i)=>s + (i.qty||1), 0);
  $$('.cart-count-badge').forEach(el => el.textContent = count);
}

/* add product to cart */
function addToCart(product, qty=1) {
  const cart = readCart();
  const existing = cart.find(i=>i.id===product.id);
  if (existing) existing.qty = (existing.qty||1) + qty;
  else cart.push({...product, qty});
  writeCart(cart);
  // small UI feedback (toast)
  showToast(`${product.title} added to cart`);
}

/* remove from cart */
function removeFromCart(productId) {
  let cart = readCart();
  cart = cart.filter(i=>i.id !== productId);
  writeCart(cart);
}

/* update qty */
function updateQty(productId, qty) {
  const cart = readCart();
  const item = cart.find(i=>i.id===productId);
  if (!item) return;
  item.qty = qty;
  if (item.qty <= 0) removeFromCart(productId);
  else writeCart(cart);
}

/* Simple toast */
function showToast(msg) {
  let toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.position = 'fixed';
  toast.style.right = '20px';
  toast.style.bottom = '20px';
  toast.style.background = 'rgba(0,0,0,0.85)';
  toast.style.color = '#fff';
  toast.style.padding = '10px 14px';
  toast.style.borderRadius = '10px';
  toast.style.zIndex = 9999;
  toast.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)';
  document.body.appendChild(toast);
  setTimeout(()=>toast.style.opacity=0, 1800);
  setTimeout(()=>toast.remove(), 2200);
}

/* ---------- Products loader (API + fallback generator) ---------- */
async function fetchProducts() {
  try {
    const res = await fetch(API_ENDPOINT);
    const data = await res.json();
    // prefer men's clothing from API
    let menProducts = data.filter(p=> (p.category && p.category.toLowerCase().includes("men")) || (p.title && p.title.toLowerCase().includes("men")));
    // fallback to full data if none
    let base = menProducts.length? menProducts : data;

    // Normalize to product shape we need
    let products = base.map(p => ({
      id: `api-${p.id}`,
      title: p.title,
      price: parseFloat(p.price),
      image: p.image,
      description: p.description || '',
      category: p.category || 'men clothing'
    }));

    // If less than MAX_PRODUCTS, generate variants
    if (products.length < MAX_PRODUCTS) {
      const generated = generateVariants(products, MAX_PRODUCTS);
      return generated;
    }
    // limit to MAX_PRODUCTS
    return products.slice(0, MAX_PRODUCTS);
  } catch(err) {
    console.warn('API fetch failed, generating mock products', err);
    return generateMockProducts(MAX_PRODUCTS);
  }
}

function generateVariants(source, targetCount) {
  const out = [];
  let counter = 1;
  while (out.length < targetCount) {
    const base = source[(out.length) % source.length] || source[0] || {title: 'Men Shirt', price: 59.99, image: ''};
    // tweak title, price and id for uniqueness
    const variant = {
      id: `gen-${out.length+1}`,
      title: `${base.title.split(' - ')[0]} ${['Black','White','Navy','Grey','Olive'][out.length % 5]} ${Math.ceil(Math.random()*999)}`,
      price: +(base.price ? (base.price * (0.9 + Math.random()*0.4)).toFixed(2) : (30 + Math.random()*140).toFixed(2)),
      image: base.image || placeholderImage(out.length),
      description: base.description || 'Premium men\'s clothing piece.',
      category: 'Men Clothing'
    };
    out.push(variant);
    counter++;
  }
  return out;
}

function generateMockProducts(count) {
  const samples = [
    'Classic Hoodie','Casual Tee','Premium Jacket','Denim Shirt','Cargo Pants','Slim Jeans','Minimal Tee','Oversized Hoodie','Leather Jacket','Bomber Jacket'
  ];
  const out = [];
  for (let i=1;i<=count;i++){
    out.push({
      id: `mock-${i}`,
      title: `${samples[i % samples.length]} ${i}`,
      price: +(30 + Math.random()*170).toFixed(2),
      image: placeholderImage(i),
      description: 'High quality men clothing designed for comfort and style.',
      category: 'Men Clothing'
    });
  }
  return out;
}

function placeholderImage(i){
  // Use picsum as placeholder
  return `https://picsum.photos/seed/faym${i}/800/800`;
}

/* ---------- Render products to page ---------- */
function renderProducts(products, opts = {}) {
  const grid = $('.products-grid');
  if (!grid) return;
  grid.innerHTML = '';
  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card reveal';
    // badge example (category)
    const badge = document.createElement('div');
    badge.className = 'badge';
    badge.textContent = p.category ? p.category.split(' ')[0].toUpperCase() : 'MEN';
    card.appendChild(badge);

    const img = document.createElement('img');
    img.className = 'product-image';
    img.alt = p.title;
    img.src = p.image || placeholderImage(p.id);
    card.appendChild(img);

    const info = document.createElement('div');
    info.className = 'product-info';
    info.innerHTML = `<div class="product-title">${escapeHtml(p.title)}</div>
                      <div class="product-price">$${p.price.toFixed(2)}</div>`;
    const actions = document.createElement('div');
    actions.className = 'product-actions';
    const addBtn = document.createElement('button');
    addBtn.className = 'btn btn-primary btn-bounce';
    addBtn.textContent = 'Add to cart';
    addBtn.onclick = ()=> addToCart(p,1);
    const viewBtn = document.createElement('a');
    viewBtn.className = 'btn btn-outline';
    viewBtn.href = `product.html?id=${encodeURIComponent(p.id)}`; // optional product page
    viewBtn.textContent = 'View';
    actions.appendChild(addBtn);
    actions.appendChild(viewBtn);
    info.appendChild(actions);
    card.appendChild(info);
    grid.appendChild(card);
  });
  // connect reveal system for newly added reveals
  initReveal();
}

/* ---------- Search / Filter / Load more ---------- */
function setupShopUI(products) {
  const searchEl = $('.search-input');
  const selectEl = $('.select');
  const loadMoreBtn = $('.load-more');

  let filtered = products.slice();
  let visibleCount = 12;

  function displaySlice() {
    renderProducts(filtered.slice(0, visibleCount));
    if (visibleCount >= filtered.length) loadMoreBtn.style.display = 'none';
    else loadMoreBtn.style.display = 'inline-block';
  }

  searchEl.addEventListener('input', (e)=>{
    const q = e.target.value.toLowerCase().trim();
    filtered = products.filter(p => p.title.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
    visibleCount = 12;
    displaySlice();
  });

  selectEl.addEventListener('change', (e)=>{
    const cat = e.target.value;
    filtered = cat === 'all' ? products.slice() : products.filter(p => (p.category||'').toLowerCase().includes(cat));
    visibleCount = 12;
    displaySlice();
  });

  loadMoreBtn.addEventListener('click', ()=>{
    visibleCount += 12;
    displaySlice();
  });

  displaySlice();
}

/* ---------- Small helper to escape HTML ---------- */
function escapeHtml(str='') {
  return (''+str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

/* ---------- Reveal system (simple) ---------- */
function initReveal() {
  const reveals = document.querySelectorAll('.reveal');
  function handle(){
    reveals.forEach(el=>{
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 80) el.classList.add('active');
    });
  }
  handle();
  window.removeEventListener('scroll', handle);
  window.addEventListener('scroll', handle);
}

/* ---------- Init on shop page ---------- */
async function initShopPage() {
  updateCartBadge();
  const products = await fetchProducts();
  // populate category select
  const categories = Array.from(new Set(products.map(p => (p.category||'Men Clothing').toLowerCase())));
  const select = $('.select');
  if (select) {
    select.innerHTML = `<option value="all">All categories</option>` + categories.map(c=>`<option value="${c}">${capitalize(c)}</option>`).join('');
  }
  // render grid container
  window.SHOP_PRODUCTS = products; // debug
  setupShopUI(products);
}

/* ---------- small helpers ---------- */
function capitalize(s=''){ return s.charAt(0).toUpperCase() + s.slice(1); }

/* ---------- Cart page helpers ---------- */
function renderCartPage() {
  updateCartBadge();
  const cart = readCart();
  const list = $('.cart-list');
  const summary = $('.summary');
  if (!list) return;
  list.innerHTML = '';
  let subtotal = 0;
  cart.forEach(item=>{
    subtotal += item.price * item.qty;
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <img src="${item.image || placeholderImage(item.id)}" alt="${escapeHtml(item.title)}">
      <div style="flex:1;">
        <div style="font-weight:700">${escapeHtml(item.title)}</div>
        <div style="color:#666;margin:6px 0">$${item.price.toFixed(2)}</div>
        <div style="display:flex;gap:8px;align-items:center">
          <input class="qty-input" type="number" min="0" value="${item.qty}" data-id="${item.id}">
          <button class="btn btn-outline remove-btn" data-id="${item.id}">Remove</button>
        </div>
      </div>
      <div style="min-width:120px;text-align:right;font-weight:700">$${(item.price * item.qty).toFixed(2)}</div>
    `;
    list.appendChild(row);
  });
  if (summary) {
    summary.innerHTML = `
      <div class="summary-row"><div>Subtotal</div><div>$${subtotal.toFixed(2)}</div></div>
      <div class="summary-row"><div>Shipping</div><div>$${(subtotal>0?9.99:0).toFixed(2)}</div></div>
      <div class="summary-row" style="font-weight:800;font-size:18px"><div>Total</div><div>$${(subtotal>0? (subtotal+9.99):0).toFixed(2)}</div></div>
      <div style="margin-top:12px"><a href="checkout.html" class="btn btn-primary">Proceed to checkout</a></div>
    `;
  }
  // attach events
  $$('.qty-input').forEach(el=>{
    el.addEventListener('change', e=>{
      const id = el.dataset.id;
      const q = parseInt(el.value) || 0;
      updateQty(id, q);
      renderCartPage();
    });
  });
  $$('.remove-btn').forEach(b=>{
    b.addEventListener('click', e=>{
      const id = b.dataset.id;
      removeFromCart(id);
      renderCartPage();
    });
  });
  updateCartBadge();
}

/* ---------- Checkout page helpers ---------- */
function renderCheckoutPage() {
  updateCartBadge();
  const items = readCart();
  const list = $('.checkout-items');
  const totalWrap = $('.checkout-total');
  if (!list) return;
  list.innerHTML = '';
  let subtotal = 0;
  items.forEach(it=>{
    subtotal += it.price * it.qty;
    const li = document.createElement('div');
    li.style.display='flex';li.style.justifyContent='space-between';li.style.padding='8px 0';
    li.innerHTML = `<div>${escapeHtml(it.title)} x ${it.qty}</div><div>$${(it.price*it.qty).toFixed(2)}</div>`;
    list.appendChild(li);
  });
  const shipping = subtotal>0?9.99:0;
  if (totalWrap) totalWrap.innerHTML = `<div style="display:flex;justify-content:space-between;margin-bottom:6px"><div>Subtotal</div><div>$${subtotal.toFixed(2)}</div></div>
    <div style="display:flex;justify-content:space-between;margin-bottom:12px"><div>Shipping</div><div>$${shipping.toFixed(2)}</div></div>
    <div style="display:flex;justify-content:space-between;font-weight:800"><div>Total</div><div>$${(subtotal+shipping).toFixed(2)}</div></div>`;
}

/* ---------- Orders (mock) ---------- */
function placeOrder(formData) {
  // Mock processing
  const cart = readCart();
  if (!cart.length) {
    showToast('Cart empty');
    return false;
  }
  // Build order payload (mock)
  const order = {
    id: 'ORD-' + Date.now(),
    items: cart,
    customer: formData,
    total: cart.reduce((s,i)=>s+i.price*i.qty,0) + 9.99
  };
  // "send" -> we just log and clear cart
  console.log('Order placed', order);
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
  return order;
}

/* ---------- Export for usage ---------- */
window.FAYM = {
  initShopPage,
  renderCartPage,
  renderCheckoutPage,
  addToCart,
  updateCartBadge,
  placeOrder
};

/* auto update badge on load */
document.addEventListener('DOMContentLoaded', updateCartBadge);


// cart icon link
document.querySelector('.cart-btn').addEventListener('click', () => {
  window.location.href = 'cart.html';
});







