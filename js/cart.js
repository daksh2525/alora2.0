document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    loadCartItems();
});

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelector('.cart-count').textContent = totalItems;
}

function loadCartItems() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsContainer = document.getElementById('cart-items');
    const cartSummary = document.getElementById('cart-summary');

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-cart"></i>
                <h3>Your cart is empty</h3>
                <p>Looks like you haven't added anything to your cart yet</p>
                <a href="shop.html" class="btn">Continue Shopping</a>
            </div>
        `;
        cartSummary.style.display = 'none';
        return;
    }

    cartSummary.style.display = 'block';
    let subtotal = 0;
    let cartHTML = '';

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        cartHTML += `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>₹${item.price.toLocaleString()}</p>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn increase" data-id="${item.id}">+</button>
                    </div>
                    <p class="remove-item" data-id="${item.id}">Remove</p>
                </div>
                <div class="cart-item-total">₹${itemTotal.toLocaleString()}</div>
            </div>
        `;
    });

    cartItemsContainer.innerHTML = cartHTML;
    document.querySelector('.subtotal').textContent = `₹${subtotal.toLocaleString()}`;

    let discount = subtotal > 2000 ? subtotal * 0.1 : 0;
    document.querySelector('.discount').textContent = `-₹${discount.toLocaleString()}`;
    document.querySelector('.total-amount').textContent = `₹${(subtotal - discount).toLocaleString()}`;

    document.querySelectorAll('.increase').forEach(btn =>
        btn.addEventListener('click', () => updateQuantity(btn.dataset.id, 1))
    );
    document.querySelectorAll('.decrease').forEach(btn =>
        btn.addEventListener('click', () => updateQuantity(btn.dataset.id, -1))
    );
    document.querySelectorAll('.remove-item').forEach(btn =>
        btn.addEventListener('click', () => removeItem(btn.dataset.id))
    );
    document.querySelector('.checkout-btn').addEventListener('click', checkout);
}

function updateQuantity(id, delta) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const index = cart.findIndex(item => item.id === id);
    if (index !== -1) {
        cart[index].quantity += delta;
        if (cart[index].quantity <= 0) cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        loadCartItems();
    }
}

function removeItem(id) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    loadCartItems();
}

function checkout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        alert("Your cart is empty!");
    } else {
        alert("Proceeding to checkout!");
        // window.location.href = 'checkout.html'; // Optional
    }
}

function addToCart(event) {
    const btn = event.target;
    const product = {
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: parseFloat(btn.dataset.price),
        image: btn.dataset.image,
        quantity: 1
    };

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push(product);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showNotification(`${product.name} added to cart`);
}

function showNotification(message) {
    const note = document.createElement('div');
    note.className = 'notification';
    note.textContent = message;
    document.body.appendChild(note);

    setTimeout(() => note.classList.add('show'), 10);
    setTimeout(() => {
        note.classList.remove('show');
        setTimeout(() => document.body.removeChild(note), 500);
    }, 3000);
}
