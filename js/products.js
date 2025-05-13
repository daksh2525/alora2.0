// Product data
window.products = [
    {
        id: '1',
        name: 'Cup Cake',
        price: 2,
        image: '/images/1.jpg',
        category: 'scented',
        fragrance: 'floral'
    },
    {
        id: '2',
        name: 'Floating Candle(Pack Of 6)',
        price: 1,
        image: '/images/4.jpg',
        category: 'scented',
        fragrance: 'floral'
    },
    {
        id: '3',
        name: 'Glass Desert Candel',
        price: 399,
        image: '/images/product1.jpg',
        category: 'luxury',
        fragrance: 'woody'
    },
    {
        id: '4',
        name: 'Glass Sunflower Candle',
        price: 399,
        image: '/images/product2.jpg',
        category: 'scented',
        fragrance: 'citrus'
    },
     {
        id: '5',
        name: 'Budha Candle(Pack Of 3)',
        price: 149,
        image: '/images/product3.jpg',
        category: 'scented',
        fragrance: 'citrus'
    },
     {
        id: '6',
        name: 'Rose Candle',
        price: 149,
        image: '/images/product4.jpg',
        category: 'scented',
        fragrance: 'citrus'
    },
     {
        id: '7',
        name: 'Bubble Candle',
        price: 199,
        image: '/images/product5.jpg',
        category: 'scented',
        fragrance: 'citrus'
    },
     {
        id: '8',
        name: 'Glass Candle',
        price: 399,
        image: '/images/product6.jpg',
        category: 'scented',
        fragrance: 'citrus'
    },
   
   
];

// Featured Products Section
function loadFeaturedProducts() {
    const featuredGrid = document.getElementById('featured-products');
    featuredGrid.innerHTML = '';  // Clear any existing content

    // Loop through all items and create product cards
    window.products.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'product-card';
        
        itemCard.innerHTML = `
            <div class="product-image">
                <img src="${item.image}" alt="${item.name}"> <!-- Display image -->
            </div>
            <div class="product-info">
                <h3 class="product-name">${item.name}</h3>
                <p class="product-price">₹${item.price.toLocaleString()}</p>
                <div class="product-actions">
                    <button class="btn add-to-cart" 
                        data-id="${item.id}" 
                        data-name="${item.name}" 
                        data-price="${item.price}" 
                        data-image="${item.image}">
                        Add to Cart
                    </button>
                    <button class="btn btn-secondary quick-view" data-id="${item.id}">
                        Quick View
                    </button>
                </div>
            </div>
        `;
        
        featuredGrid.appendChild(itemCard);  // Append item card to grid
    });
    
    // Add event listeners to new buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', addToCart);
    });
}


  // Image URLs array
  const collectionImages = [
    '/images/22.png',
    '/images/slider1.png',
    '/images/slider2.png',
    '/images/slider3.png',
    '/images/slider4.png',
    '/images/22.png',
    '/images/slider1.png',
    '/images/slider2.png',
    '/images/slider3.png',
    '/images/slider4.png',
    // Add more image paths as needed
  ];

  const sliderTrack = document.querySelector('.collection-slider-track');

  // Function to create slides
  function renderCollectionImages(images) {
    images.forEach((src) => {
      const slide = document.createElement('div');
      slide.className = 'collection-slide';
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'Collection Image';
      slide.appendChild(img);
      sliderTrack.appendChild(slide);
    });
  }

  renderCollectionImages(collectionImages);



// Quick View Modal
function showQuickView(event) {
    const productId = event.target.dataset.id;
    const product = window.products.find(p => p.id === productId);
    
    if (!product) return;

    const quickViewHTML = `
        <div class="quick-view-modal">
            <div class="quick-view-content">
                <span class="close-quick-view">&times;</span>
                <div class="quick-view-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="quick-view-details">
                    <h3>${product.name}</h3>
                    <p class="price">₹${product.price.toLocaleString()}</p>
                    <p class="category">Category: ${product.category}</p>
                    <p class="fragrance">Fragrance: ${product.fragrance}</p>
                    <button class="btn add-to-cart" 
                        data-id="${product.id}" 
                        data-name="${product.name}" 
                        data-price="${product.price}" 
                        data-image="${product.image}">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', quickViewHTML);
    
    // Add event listeners
    document.querySelector('.close-quick-view').addEventListener('click', () => {
        document.querySelector('.quick-view-modal').remove();
    });
    
    document.querySelector('.quick-view-modal .add-to-cart').addEventListener('click', addToCart);
    
    // Close when clicking outside
    document.querySelector('.quick-view-modal').addEventListener('click', (e) => {
        if (e.target === document.querySelector('.quick-view-modal')) {
            document.querySelector('.quick-view-modal').remove();
        }
    });
}

// DOMContentLoaded Event
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('featured-products')) {
        loadFeaturedProducts();
    }
    
    if (document.querySelector('.collection-slider-track')) {
        loadCollectionSlider();
    }
});
