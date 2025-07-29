const db = require('../config/db');

const Attribute = {
    /**
     * Finds all attributes associated with a given category ID.
     * @param {number} categoryId - The ID of the category.
     * @returns {Promise<Array>} An array of attribute objects.
     */
    async findByCategoryId(categoryId) {
        const sql = `
            SELECT id, name
            FROM attributes
            WHERE category_id = ?
            ORDER BY name
        `;
        const [rows] = await db.query(sql, [categoryId]);
        return rows;
    }
};

module.exports = Attribute;