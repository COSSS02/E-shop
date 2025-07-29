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
    }
};

module.exports = attributeController;