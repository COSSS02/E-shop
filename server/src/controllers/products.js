const Product = require('../models/products');
const Category = require('../models/category');

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
     * Handles updating an existing product.
     */
    async updateProduct(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const { productData, attributesData } = req.body;

            if (!productData || !attributesData) {
                return res.status(400).json({ message: "Missing productData or attributesData." });
            }

            await Product.update(Number(id), userId, productData, attributesData);
            res.status(200).json({ message: "Product updated successfully", productId: id });

        } catch (error) {
            // Handle specific errors from the model
            if (error.message.includes("authorized")) {
                return res.status(403).json({ message: error.message });
            }
            if (error.message.includes("not found")) {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: "Error updating product", error: error.message });
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
     * Handles searching for products.
     */
    async searchProducts(req, res) {
        try {
            const { q } = req.query;
            if (!q) {
                return res.status(400).json({ message: "Search query 'q' is required." });
            }

            const limit = parseInt(req.query.limit, 10) || 12;
            const page = parseInt(req.query.page, 10) || 1;
            const offset = (page - 1) * limit;

            const sort = req.query.sort || 'name-asc';
            const [sortBy, sortOrder] = sort.split('-');

            const { products, totalProducts } = await Product.search(q, limit, offset, sortBy, sortOrder);

            res.status(200).json({
                products,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalProducts / limit),
                    totalProducts,
                    limit
                }
            });
        } catch (error) {
            res.status(500).json({ message: "Error searching for products", error: error.message });
        }
    },

    /**
     * Handles retrieving all products for a given category.
     */
    async getProductsByCategory(req, res) {
        try {
            const { categoryName } = req.params;
            const limit = parseInt(req.query.limit, 10) || 12;
            const page = parseInt(req.query.page, 10) || 1;
            const offset = (page - 1) * limit;

            const sort = req.query.sort || 'name-asc';
            const [sortBy, sortOrder] = sort.split('-');

            const filters = { ...req.query };
            delete filters.limit;
            delete filters.page;
            delete filters.sort;

            // 1. Find the category details (including description)
            const category = await Category.findByName(categoryName);
            if (!category) {
                return res.status(404).json({ message: "Category not found" });
            }

            // 2. Find all products in that category with pagination
            const { products, totalProducts } = await Product.findByCategoryName(categoryName, limit, offset, sortBy, sortOrder, filters);

            // 3. Send both back to the client with pagination info
            res.status(200).json({
                category,
                products,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalProducts / limit),
                    totalProducts,
                    limit
                }
            });

        } catch (error) {
            res.status(500).json({ message: "Error retrieving products by category", error: error.message });
        }
    },

    async getAllProducts(req, res) {
        try {
            // Set default limit to 20, can be overridden by query param
            const limit = parseInt(req.query.limit, 10) || 12;
            // Get page from query param, default to page 1
            const page = parseInt(req.query.page, 10) || 1;
            const offset = (page - 1) * limit;

            const sort = req.query.sort || 'name-asc'; // e.g., 'price-asc'
            const [sortBy, sortOrder] = sort.split('-');

            const { products, totalProducts } = await Product.findAll(limit, offset, sortBy, sortOrder);

            res.status(200).json({
                products,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalProducts / limit),
                    totalProducts,
                    limit
                }
            });
        } catch (error) {
            res.status(500).json({ message: "Error retrieving products", error: error.message });
        }
    }
};

module.exports = productController;