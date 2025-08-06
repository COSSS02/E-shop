const Attribute = require('../models/attribute');

const attributeController = {
    /**
     * Handles retrieving all attributes for a given category.
     */
    async getAttributesByCategory(req, res) {
        try {
            const { categoryId } = req.params;
            const attributes = await Attribute.findByCategoryId(categoryId);
            res.status(200).json(attributes);
        } catch (error) {
            res.status(500).json({ message: "Error retrieving attributes", error: error.message });
        }
    },

    /**
     * Handles retrieving filterable attributes for a category page.
     */
    async getCategoryFilters(req, res) {
        try {
            const { categoryName } = req.params;
            const activeFilters = req.body.filters || {};
            const filters = await Attribute.getFiltersForCategory(categoryName, activeFilters);
            res.status(200).json(filters);
        } catch (error) {
            res.status(500).json({ message: "Error retrieving filters", error: error.message });
        }
    }
};

module.exports = attributeController;