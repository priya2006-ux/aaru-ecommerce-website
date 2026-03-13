const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Product = require('./models/Product');
const Seller = require('./models/Seller'); 

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

mongoose.connect('mongodb://127.0.0.1:27017/aaru_db')
    .then(() => {
        console.log('✅ Aaru Database Connected!');
        seedData(); 
    })
    .catch(err => console.log('❌ DB Connection Error:', err));

// --- SEED DATA FUNCTION ---
async function seedData() {
    try {
        const count = await Product.countDocuments();
        if (count > 0) return; 

        await Seller.deleteMany({});
        // Added 3 distinct sellers for your "Featured Sellers" section
        const sellers = [
            { name: "Cloudtail India", shopName: "Aaru-Official", email: "admin@aaru.in", password: "123", specialty: "Electronics", logoUrl: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100" },
            { name: "Aaru Retail", shopName: "Home-Store", email: "home@aaru.in", password: "123", specialty: "Home Essentials", logoUrl: "https://images.unsplash.com/photo-1542744094-24638eff58bb?w=100" },
            { name: "Appario Books", shopName: "Book-Depot", email: "books@aaru.in", password: "123", specialty: "Premium Authors", logoUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=100" }
        ];
        const createdSellers = await Seller.insertMany(sellers);

        const categories = [
            { name: "Electronics", imgs: ["https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500"] },
            { name: "Books", imgs: ["https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500"] },
            { name: "Home & Kitchen", imgs: ["https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=500"] }
        ];

        const newProducts = [];
        for (let i = 1; i <= 2000; i++) {
            const catObj = categories[i % categories.length];
            const sellerObj = createdSellers[i % createdSellers.length]; // Assign products to sellers
            
            newProducts.push({
                name: `Aaru ${catObj.name} - Premium Model ${i}`,
                description: `High quality ${catObj.name} item.`,
                price: parseFloat((Math.random() * 5000 + 99).toFixed(2)),
                imageUrl: catObj.imgs[0],
                category: catObj.name,
                sellerName: sellerObj.name, // NEW: Links product to seller
                stock: Math.floor(Math.random() * 100) + 1
            });
            if (newProducts.length === 500) {
                await Product.insertMany(newProducts);
                newProducts.length = 0;
            }
        }
        if (newProducts.length > 0) await Product.insertMany(newProducts);

        console.log('🚀 Database Seeded Successfully!');
    } catch (err) { console.error("❌ Seeding failed:", err.message); }
}

// --- SEARCH ROUTE (NEW) ---
app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);
        
        const products = await Product.find({
            name: { $regex: q, $options: 'i' } // Case-insensitive keyword search
        }).limit(50);
        
        res.json(products);
    } catch (err) { res.status(500).send("Search Error"); }
});

// --- SELLERS ROUTE (NEW) ---
app.get('/api/sellers', async (req, res) => {
    try {
        const sellers = await Seller.find({});
        res.json(sellers);
    } catch (err) { res.status(500).send("Server Error"); }
});

// --- PUBLIC PRODUCT ROUTE (UPDATED) ---
app.get('/api/products', async (req, res) => {
    try {
        const { category, seller } = req.query;
        let query = {};
        if (category && category !== "All") query.category = category;
        if (seller) query.sellerName = seller; // Handles filtering when clicking a seller logo
        
        const products = await Product.find(query).limit(50);
        res.json(products);
    } catch (err) { res.status(500).send("Server Error"); }
});

// --- LOGIN ROUTE ---
app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;
    try {
        if (role === 'admin') {
            const admin = await Seller.findOne({ email, password });
            if (admin) return res.json({ success: true, message: "Admin Login Successful" });
        } else {
            if (email && password) return res.json({ success: true, message: "User Login Successful" });
        }
        res.status(401).json({ success: false, message: "Invalid Credentials" });
    } catch (err) { res.status(500).json({ error: "Login Error" }); }
});

// --- SECURE ADMIN ROUTES ---
app.get('/api/admin/products', async (req, res) => {
    const authHeader = req.headers['admin-secret'];
    if (authHeader !== 'aaru-admin-access-key') return res.status(403).json({ message: "Unauthorized" });
    try {
        const products = await Product.find({}).sort({ _id: -1 });
        res.json(products);
    } catch (err) { res.status(500).send("Server Error"); }
});

app.delete('/api/admin/products/:id', async (req, res) => {
    const authHeader = req.headers['admin-secret'];
    if (authHeader !== 'aaru-admin-access-key') return res.status(403).json({ success: false });
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Deleted" });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.put('/api/admin/products/:id', async (req, res) => {
    const authHeader = req.headers['admin-secret'];
    if (authHeader !== 'aaru-admin-access-key') return res.status(403).json({ success: false });
    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id, 
            { $set: req.body }, 
            { returnDocument: 'after', runValidators: true } 
        );
        res.json({ success: true, product: updatedProduct });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.listen(PORT, () => console.log(`🌍 Server running at http://localhost:${PORT}`));