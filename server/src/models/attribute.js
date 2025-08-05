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
    },

        /**
     * Finds attributes and their distinct values for a given category, suitable for filtering.
     * It only returns attributes with more than 1 and less than or equal to 6 distinct values.
     * @param {string} categoryName - The name of the category.
     * @returns {Promise<Array>} An array of filter objects, e.g., [{ attributeName, values }].
     */
    async getFiltersForCategory(categoryName) {
        const sql = `
            SELECT
                a.name AS attributeName,
                JSON_ARRAYAGG(DISTINCT pa.value) AS attributeValues
            FROM products p
            JOIN categories c ON p.category_id = c.id
            JOIN product_attributes pa ON p.id = pa.product_id
            JOIN attributes a ON pa.attribute_id = a.id
            WHERE c.name = ?
            GROUP BY a.name
            HAVING COUNT(DISTINCT pa.value) BETWEEN 2 AND 40
            ORDER BY a.name;
        `;
        const [filters] = await db.query(sql, [categoryName]);

        // JSON_ARRAYAGG returns a string, so we must parse it into a JS array.
        // The data is already a JS object from the DB driver, but the 'attributeValues' property is a string.
        return filters.map(filter => {
            const parsedValues = JSON.parse(filter.attributeValues);

            // Sort the values using a natural sort algorithm.
            // This correctly sorts numbers as numbers (2 before 10)
            // and also handles alphanumeric strings (e.g., "8GB" before "16GB").
            parsedValues.sort((a, b) => {
                return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
            });

            return {
                ...filter,
                attributeValues: parsedValues
            };
        });
    }
};

module.exports = Attribute;