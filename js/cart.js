document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    loadCartItems();
    setupCheckoutForm();
});

// Cart Management Functions
function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalItems;
    });
}

function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function loadCartItems() {
    const cart = getCart();
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
                <img src="${item.image}" alt="${item.name}" class="cart-item-img" loading="lazy">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p class="price">₹${item.price.toLocaleString()}</p>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn decrease" data-id="${item.id}" aria-label="Decrease quantity">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn increase" data-id="${item.id}" aria-label="Increase quantity">+</button>
                    </div>
                    <button class="remove-item" data-id="${item.id}" aria-label="Remove item">Remove</button>
                </div>
                <div class="cart-item-total">₹${itemTotal.toLocaleString()}</div>
            </div>
        `;
    });

    cartItemsContainer.innerHTML = cartHTML;
    updateCartSummary(subtotal);

    // Add event listeners
    document.querySelectorAll('.increase').forEach(btn => {
        btn.addEventListener('click', () => updateQuantity(btn.dataset.id, 1));
    });
    
    document.querySelectorAll('.decrease').forEach(btn => {
        btn.addEventListener('click', () => updateQuantity(btn.dataset.id, -1));
    });
    
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', () => removeItem(btn.dataset.id));
    });
}

function updateCartSummary(subtotal) {
    document.querySelector('.subtotal').textContent = `₹${subtotal.toLocaleString()}`;
    
    // Apply 10% discount for orders above ₹2000
    const discount = subtotal > 2000 ? subtotal * 0.1 : 0;
    document.querySelector('.discount').textContent = `-₹${discount.toLocaleString()}`;
    
    const total = subtotal - discount;
    document.querySelector('.total-amount').textContent = `₹${total.toLocaleString()}`;
    
    // Update hidden amount field for checkout form
    const amountField = document.getElementById('amount');
    if (amountField) {
        amountField.value = total;
    }
}

function updateQuantity(id, delta) {
    let cart = getCart();
    const index = cart.findIndex(item => item.id === id);
    
    if (index !== -1) {
        cart[index].quantity += delta;
        
        // Remove item if quantity reaches zero
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
            showNotification('Item removed from cart');
        } else {
            showNotification('Cart updated');
        }
        
        saveCart(cart);
        loadCartItems();
    }
}

function removeItem(id) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== id);
    saveCart(cart);
    loadCartItems();
    showNotification('Item removed from cart');
}

// Checkout Functions
function setupCheckoutForm() {
    const form = document.getElementById('checkout-form');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
        
        try {
            const cart = getCart();
            if (cart.length === 0) {
                throw new Error('Your cart is empty');
            }
            
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const discount = subtotal > 2000 ? subtotal * 0.1 : 0;
            const total = subtotal - discount;
            
            const userData = {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                address: document.getElementById('address').value.trim(),
                amount: total,
                currency: "INR",
                cart: cart
            };
            
            // Validate form
            if (!userData.name || !userData.email || !userData.phone || !userData.address) {
                throw new Error('Please fill all required fields');
            }
            
            // Create Razorpay order
            const orderResponse = await fetch('/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: userData.amount,
                    currency: userData.currency,
                    notes: {
                        customer_name: userData.name,
                        customer_email: userData.email,
                        customer_phone: userData.phone,
                        shipping_address: userData.address,
                        items: userData.cart
                    }
                })
            });
            
            if (!orderResponse.ok) {
                const errorData = await orderResponse.json();
                throw new Error(errorData.error || 'Failed to create order');
            }
            
            const orderData = await orderResponse.json();
            
            // Initialize Razorpay checkout
            const options = {
                key: process.env.RAZORPAY_KEY_ID || 'rzp_live_xnsvqvXT1WqoZ4',
                amount: orderData.order.amount,
                currency: orderData.order.currency,
                name: "Alora Luxury Candles",
                description: `Order #${orderData.order.receipt}`,
                order_id: orderData.order.id,
                image: "/logo.png",
                prefill: {
                    name: userData.name,
                    email: userData.email,
                    contact: userData.phone
                },
                notes: {
                    address: userData.address
                },
                handler: async function(response) {
                    try {
                        // Verify payment
                        const verificationResponse = await fetch('/api/verify-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                order_id: response.razorpay_order_id,
                                payment_id: response.razorpay_payment_id,
                                signature: response.razorpay_signature
                            })
                        });
                        
                        const verificationData = await verificationResponse.json();
                        
                        if (verificationData.success) {
                            // Clear cart on successful payment
                            localStorage.removeItem('cart');
                            updateCartCount();
                            window.location.href = `/thank-you.html?order_id=${response.razorpay_order_id}`;
                        } else {
                            throw new Error('Payment verification failed');
                        }
                    } catch (error) {
                        console.error('Payment verification error:', error);
                        alert('Payment successful but verification failed. Please contact support with your Order ID: ' + response.razorpay_order_id);
                    }
                },
                theme: {
                    color: "#c5a880"
                }
            };
            
            const rzp = new Razorpay(options);
            rzp.open();
            
        } catch (error) {
            console.error('Checkout error:', error);
            showNotification(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

// Product Page Functions
function setupProductPage() {
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', addToCart);
    });
}

function addToCart(event) {
    const btn = event.currentTarget;
    const product = {
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: parseFloat(btn.dataset.price),
        image: btn.dataset.image,
        quantity: 1
    };

    let cart = getCart();
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
        showNotification(`${product.name} quantity updated`);
    } else {
        cart.push(product);
        showNotification(`${product.name} added to cart`);
    }

    saveCart(cart);
}

// Notification System
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="close-notification" aria-label="Close notification">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    const timer = setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
    
    // Allow manual close
    notification.querySelector('.close-notification').addEventListener('click', () => {
        clearTimeout(timer);
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    });
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 10);
}

// Initialize appropriate page functions
if (document.querySelector('.products-grid')) {
    setupProductPage();
}

if (document.getElementById('checkout-form')) {
    setupCheckoutForm();
}