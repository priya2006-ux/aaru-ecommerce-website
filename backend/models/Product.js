const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        trim: true
    }, // The extra "}" was removed from here
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: 0
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true
    },
    imageUrl: {
        type: String,
        default: 'https://via.placeholder.com/200'
    },
    stock: {
        type: Number,
        default: 10
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;``