const Category = require('../models/category');

const categoryController = {
    async createCategory (req, res){
        try {
            const { name, description } = req.body;
            if (!name) {
                return res.status(400).json({ message: "Category name is required." });
            }
            const result = await Category.create({ name, description });
            res.status(201).json({ message: "Category created successfully", categoryId: result.insertId });
        } catch (error) {
            // Handle unique constraint violation for the category name
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: "A category with this name already exists." });
            }
            res.status(500).json({ message: "Error creating category", error: error.message });
        }
    },

    async getAllCategories (req, res) {
        try {
            const categories = await Category.findAll();
            res.status(200).json(categories);
        } catch (error) {
            res.status(500).json({ message: "Error retrieving categories", error: error.message });
        }
    }
}

module.exports = categoryController;