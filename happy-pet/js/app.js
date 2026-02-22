const state = {
  currentUser: null,
  cart: []
};

const validUsers = {
  'happy.tester': { password: 'Happy123*', status: 'active', name: 'Happy Tester' },
  'cliente.bloqueado': { password: 'Happy123*', status: 'blocked', name: 'Cliente Bloqueado' }
};

const paymentCards = {
  '4111111111111111': { type: 'tarjeta', status: 'approved', message: 'Pago aprobado.' },
  '4000000000000002': { type: 'tarjeta', status: 'declined', message: 'Pago rechazado, comunícate con tu banco.' },
  '9999000011112222': { type: 'puntos', status: 'approved', message: 'Pago con Happy Pet Puntos aprobado.' },
  '9999000011110000': { type: 'puntos', status: 'blocked', message: 'Cuenta de Happy Pet Puntos bloqueada.' }
};

function money(value) { return `S/ ${value.toFixed(2)}`; }

async function loadCatalogs() {
  const [productsRes, petsRes] = await Promise.all([
    fetch('data/products.json'),
    fetch('data/pets.json')
  ]);

  const products = await productsRes.json();
  const pets = await petsRes.json();
  renderProducts(products);
  renderPets(pets);
}

function renderProducts(products) {
  const host = document.getElementById('productsContainer');
  host.innerHTML = products.map(p => `
    <article class="card" data-testid="product-${p.id}">
      <img src="${p.image}" alt="${p.name}">
      <div class="body">
        <span class="tag">${p.id}</span>
        <h3>${p.name}</h3>
        <p>${p.description}</p>
        <strong>${money(p.price)}</strong>
        <button class="add-to-cart" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-testid="add-${p.id}">Agregar al carrito</button>
      </div>
    </article>
  `).join('');

  host.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      state.cart.push({
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: Number(btn.dataset.price)
      });
      renderCart();
    });
  });
}

function renderPets(pets) {
  const host = document.getElementById('petsContainer');
  host.innerHTML = pets.map(p => `
    <article class="card" data-testid="pet-${p.id}">
      <img src="${p.image}" alt="${p.name}">
      <div class="body">
        <span class="tag">${p.type}</span>
        <h3>${p.name}</h3>
        <p>${p.description}</p>
        <p><strong>Edad:</strong> ${p.age}</p>
        <button class="small-btn adopt-btn" data-pet="${p.name}" data-testid="adopt-${p.id}">Quiero adoptar</button>
      </div>
    </article>
  `).join('');

  host.querySelectorAll('.adopt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('petName').value = btn.dataset.pet;
      location.hash = '#adopcion';
    });
  });
}

function renderCart() {
  const cartList = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  if (!state.cart.length) {
    cartList.innerHTML = '<p class="small">Tu carrito está vacío.</p>';
    totalEl.textContent = money(0);
    return;
  }

  cartList.innerHTML = state.cart.map((item, idx) => `
    <div class="cart-item" data-testid="cart-item-${idx}">
      <span>${item.name}</span>
      <span>${money(item.price)}</span>
    </div>
  `).join('');

  const total = state.cart.reduce((acc, item) => acc + item.price, 0);
  totalEl.textContent = money(total);
}

function handleLogin(evt) {
  evt.preventDefault();
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  const statusEl = document.getElementById('loginStatus');
  const user = validUsers[username];

  if (!user || user.password !== password) {
    statusEl.innerHTML = '<span class="danger">Usuario o contraseña incorrectos.</span>';
    state.currentUser = null;
    return;
  }

  if (user.status === 'blocked') {
    statusEl.innerHTML = '<span class="danger">Usuario bloqueado. Contacta soporte.</span>';
    state.currentUser = null;
    return;
  }

  state.currentUser = username;
  statusEl.innerHTML = `<span class="ok">Bienvenido ${user.name}. Login exitoso.</span>`;
}

function handleAdoption(evt) {
  evt.preventDefault();
  const name = document.getElementById('adopterName').value.trim();
  const pet = document.getElementById('petName').value.trim();
  const phone = document.getElementById('adopterPhone').value.trim();
  const msg = document.getElementById('adoptionResult');

  if (!name || !pet || !phone) {
    msg.textContent = 'Completa todos los campos para iniciar trámite.';
    return;
  }

  msg.textContent = `Solicitud para adoptar a ${pet} en trámite. Estado: proceso de validación.`;
}

function handleCheckout(evt) {
  evt.preventDefault();
  const output = document.getElementById('checkoutResult');

  if (!state.currentUser) {
    output.innerHTML = '<span class="danger">Debes iniciar sesión para pagar.</span>';
    return;
  }

  if (!state.cart.length) {
    output.innerHTML = '<span class="danger">Carrito vacío, agrega productos.</span>';
    return;
  }

  const method = document.getElementById('paymentMethod').value;

  if (method === 'cash') {
    output.innerHTML = '<span class="ok">Pedido confirmado. Pago contra entrega.</span>';
    state.cart = [];
    renderCart();
    return;
  }

  const card = document.getElementById('cardNumber').value.trim();
  const cardData = paymentCards[card];
  if (!cardData) {
    output.innerHTML = '<span class="danger">Tarjeta/método no reconocido para pruebas.</span>';
    return;
  }

  if (method === 'card' && cardData.type !== 'tarjeta') {
    output.innerHTML = '<span class="danger">Debes usar una tarjeta bancaria de prueba.</span>';
    return;
  }

  if (method === 'points' && cardData.type !== 'puntos') {
    output.innerHTML = '<span class="danger">Debes usar una cuenta Happy Pet Puntos.</span>';
    return;
  }

  if (cardData.status !== 'approved') {
    output.innerHTML = `<span class="danger">${cardData.message}</span>`;
    return;
  }

  output.innerHTML = `<span class="ok">${cardData.message}</span>`;
  state.cart = [];
  renderCart();
}

function wireEvents() {
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('adoptionForm').addEventListener('submit', handleAdoption);
  document.getElementById('checkoutForm').addEventListener('submit', handleCheckout);
  document.getElementById('paymentMethod').addEventListener('change', e => {
    document.getElementById('cardBox').classList.toggle('hidden', e.target.value === 'cash');
  });
}

wireEvents();
renderCart();
loadCatalogs();
