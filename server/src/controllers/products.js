const Product = require('../models/products');

const productController = {
    /**
     * Handles the creation of a new product.
     */
    async createProduct(req, res) {
        try {
            // Get the provider's ID from the authenticated user's token.
            const provider_id = req.user.id;

            // Note: In a real app, you'd get provider_id from the authenticated user (req.user.id)
            const { productData, attributesData } = req.body;

            if (!productData || !attributesData) {
                return res.status(400).json({ message: "Missing productData or attributesData in request body." });
            }

            // IMPORTANT: Overwrite any provider_id in the body with the one from the token.
            productData.provider_id = provider_id;

            const productId = await Product.create(productData, attributesData);
            res.status(201).json({ message: "Product created successfully", productId });

        } catch (error) {
            res.status(500).json({ message: "Error creating product", error: error.message });
        }
    },

    /**
     * Handles retrieving a single product by its ID.
     */
    async getProductById(req, res) {
        try {
            const { id } = req.params;
            const product = await Product.findById(id);

            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }

            res.status(200).json(product);

        } catch (error) {
            res.status(500).json({ message: "Error retrieving product", error: error.message });
        }
    },

    /**
     * Handles retrieving all products for a given category.
     */
    async getProductsByCategory(req, res) {
        try {
            const { categoryName } = req.params;
            const products = await Product.findByCategoryName(categoryName);
            res.status(200).json(products);
        } catch (error) {
            res.status(500).json({ message: "Error retrieving products by category", error: error.message });
        }
    },

    async getAllProducts(req, res) {
        try {
            const products = await Product.findAll();
            res.status(200).json(products);
        } catch (error) {
            res.status(500).json({ message: "Error retrieving products", error: error.message });
        }
    }
};

module.exports = productController;