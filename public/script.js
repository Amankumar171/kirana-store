const productList = document.getElementById('product-list');
const selectedItems = document.getElementById('selected-items');
const orderForm = document.getElementById('order-form');
const formMessage = document.getElementById('form-message');

let products = [];
let cart = [];
const whatsappNumber = '917234932442';

const imageMap = {
  atta: '/images/atta.svg',
  rice: '/images/rice.svg',
  milk: '/images/milk.svg',
  eggs: '/images/eggs.svg'
};

function getProductImage(product) {
  return imageMap[product.name.toLowerCase()] || '/images/hero.svg';
}

async function loadProducts() {
  const response = await fetch('/api/products');
  products = await response.json();
  renderProducts();
}

function renderProducts() {
  productList.innerHTML = '';
  products.forEach((product) => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${getProductImage(product)}" alt="${product.name}" />
      <h3>${product.name}</h3>
      <p>${product.category}</p>
      <strong>₹${product.price} / ${product.unit}</strong>
      <button data-id="${product.id}">Add to basket</button>
    `;
    productList.appendChild(card);
  });
}

function renderCart() {
  if (!cart.length) {
    selectedItems.innerHTML = '<p>No items selected yet.</p>';
    return;
  }

  selectedItems.innerHTML = cart.map((item) => `<div>${item.name} × ${item.quantity}</div>`).join('');
}

function buildWhatsAppMessage(payload) {
  const itemText = payload.items.length
    ? payload.items.map((item) => `${item.name} x${item.quantity}`).join(', ')
    : 'No items selected';

  return `New kirana order:\nCustomer: ${payload.customerName}\nPhone: ${payload.phone}\nAddress: ${payload.address}\nItems: ${itemText}`;
}

function openWhatsAppOrder(payload) {
  const message = encodeURIComponent(buildWhatsAppMessage(payload));
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
}

productList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-id]');
  if (!button) return;

  const product = products.find((item) => item.id === Number(button.dataset.id));
  if (!product) return;

  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id: product.id, name: product.name, quantity: 1 });
  }
  renderCart();
});

orderForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  formMessage.textContent = '';

  const payload = {
    customerName: document.getElementById('customerName').value,
    phone: document.getElementById('phone').value,
    address: document.getElementById('address').value,
    items: cart
  };

  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  formMessage.textContent = result.message || 'Order placed.';

  if (result.success) {
    openWhatsAppOrder(payload);
  }

  orderForm.reset();
  cart = [];
  renderCart();
});

loadProducts();
renderCart();
