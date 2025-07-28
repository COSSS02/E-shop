const db = require('../config/db');

const Category = {
    /**
     * Creates a new category.
     * @param {object} categoryData - The category's data { name, description }.
     * @returns {Promise<object>} The result from the database insertion.
     */
    async create(categoryData) {
        const { name, description } = categoryData;
        const sql = `INSERT INTO categories (name, description) VALUES (?, ?)`;
        const [result] = await db.query(sql, [name, description]);
        return result;
    },

    /**
     * Finds a single category by its name.
     * @param {string} categoryName - The name of the category.
     * @returns {Promise<object|null>} The category object or null if not found.
     */
    async findByName(categoryName) {
        const sql = `SELECT * FROM categories WHERE name = ?`;
        const [rows] = await db.query(sql, [categoryName]);
        return rows.length > 0 ? rows[0] : null;
    },

    /**
     * Finds all categories.
     * @returns {Promise<Array>} An array of all category objects.
     */
    async findAll() {
        const sql = `SELECT * FROM categories ORDER BY name`;
        const [rows] = await db.query(sql);
        return rows;
    }
};

module.exports = Category;