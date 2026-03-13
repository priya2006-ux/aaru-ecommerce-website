document.addEventListener('DOMContentLoaded', () => {
    const productContainer = document.getElementById('product-container');
    const sellerContainer = document.getElementById('seller-container'); // NEW
    const homeSection = document.getElementById('home-section');
    const serviceSection = document.getElementById('service-section');
    const navLinks = document.querySelectorAll('.nav-link');
    const logoHome = document.getElementById('logo-home');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    let cartCount = 0;

    // --- 1. Initial Load ---
    loadSellers(); // NEW: Load the logos at the top
    fetchProducts('/api/products');

    // --- 2. Navigation Logic ---
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const text = link.innerText.trim();

            if (text === "Customer Service") {
                showServiceView();
            } else {
                showHomeView();
                // Filter by category if not "All"
                const url = (text === "All") ? '/api/products' : `/api/products?category=${encodeURIComponent(text)}`;
                fetchProducts(url);
            }
        });
    });

    // --- 3. Search Logic ---
    function performSearch() {
        const query = searchInput.value.trim();
        if (query) {
            showHomeView();
            fetchProducts(`/api/search?q=${encodeURIComponent(query)}`);
        }
    }

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // --- 4. Seller Loading Logic (NEW) ---
    async function loadSellers() {
        if (!sellerContainer) return;
        try {
            const res = await fetch('/api/sellers');
            const sellers = await res.json();
            sellerContainer.innerHTML = sellers.map(s => `
                <div class="seller-card" onclick="filterBySeller('${s.name}')">
                    <img src="${s.logoUrl}" class="seller-logo" alt="${s.name}">
                    <h4>${s.name}</h4>
                    <p style="font-size:11px; color:gray">${s.specialty || ''}</p>
                </div>
            `).join('');
        } catch (err) {
            console.error("Sellers failed to load");
        }
    }

    // Global helper for seller clicks
    window.filterBySeller = (name) => {
        showHomeView();
        fetchProducts(`/api/products?seller=${encodeURIComponent(name)}`);
    };

    // --- 5. Helper Functions for Views ---
    function showHomeView() {
        if (homeSection) homeSection.style.display = 'block';
        if (serviceSection) serviceSection.style.display = 'none';
    }

    function showServiceView() {
        if (homeSection) homeSection.style.display = 'none';
        if (serviceSection) serviceSection.style.display = 'block';
        window.scrollTo(0, 0); 
    }

    // --- 6. Data Fetching ---
    async function fetchProducts(url) {
        if (!productContainer) return;
        productContainer.innerHTML = '<div class="loading">Fetching Aaru Products...</div>';
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            renderGrid(data);
        } catch (err) {
            productContainer.innerHTML = '<p class="error">Unable to connect to server.</p>';
        }
    }

    // --- 7. Rendering Logic (RUPEE FORMATTING PRESERVED) ---
    function renderGrid(products) {
        productContainer.innerHTML = '';
        
        if (!products || products.length === 0) {
            productContainer.innerHTML = '<h3>No products found.</h3>';
            return;
        }

        products.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            card.innerHTML = `
                <div class="img-wrap">
                    <img src="${p.imageUrl}" alt="${p.name}" onerror="this.src='https://placehold.co/200x200?text=No+Image'">
                </div>
                <div class="product-info">
                    <h3>${p.name}</h3>
                    <p class="price">₹${Number(p.price).toLocaleString('en-IN')}</p>
                    <button class="add-btn" onclick="addToCart()">Add to Cart</button>
                </div>
            `;
            productContainer.appendChild(card);
        });
    }

    // --- 8. Global Actions ---
    window.addToCart = () => {
        cartCount++;
        const cartDisplay = document.getElementById('cart-display');
        if (cartDisplay) cartDisplay.innerText = cartCount;
    };

    logoHome.addEventListener('click', () => {
        showHomeView();
        fetchProducts('/api/products');
    });
});