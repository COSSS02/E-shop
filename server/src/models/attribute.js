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
     * @param {object} activeFilters - An object of currently active filters.
     * @returns {Promise<Array>} An array of filter objects, e.g., [{ attributeName, values }].
     */
    async getFiltersForCategory(categoryName, activeFilters = {}) {
        // First, get the category ID to scope all subsequent queries.
        const [[category]] = await db.query('SELECT id FROM categories WHERE name = ?', [categoryName]);
        if (!category) {
            return []; // Category not found.
        }
        const categoryId = category.id;

        // Get all attributes that are viable as filters for this category (i.e., have at least 2 options).
        const potentialFiltersSql = `
            SELECT a.name AS attributeName
            FROM attributes a
            JOIN product_attributes pa ON a.id = pa.attribute_id
            JOIN products p ON pa.product_id = p.id
            WHERE p.category_id = ?
            GROUP BY a.name
            HAVING COUNT(DISTINCT pa.value) >= 2;
        `;
        const [potentialFilters] = await db.query(potentialFiltersSql, [categoryId]);
        const potentialFilterNames = potentialFilters.map(f => f.attributeName);

        const finalFilters = [];

        // For each potential filter, calculate its available options based on the *other* active filters.
        for (const attributeNameToGetOptionsFor of potentialFilterNames) {
            // Create a context of all other active filters, excluding the current one.
            const contextFilters = { ...activeFilters };
            delete contextFilters[attributeNameToGetOptionsFor];

            // Find the list of products that match this specific context.
            let productIdsQuery;
            let productIdsParams;
            const contextFilterKeys = Object.keys(contextFilters);

            if (contextFilterKeys.length > 0) {
                const filterPairs = contextFilterKeys.map(key => [key, contextFilters[key]]);
                productIdsQuery = `
                    SELECT pa.product_id as id
                    FROM product_attributes pa
                    JOIN attributes a ON pa.attribute_id = a.id
                    JOIN products p ON pa.product_id = p.id
                    WHERE p.category_id = ? AND (a.name, pa.value) IN (?)
                    GROUP BY pa.product_id
                    HAVING COUNT(DISTINCT a.name) = ?
                `;
                productIdsParams = [categoryId, filterPairs, contextFilterKeys.length];
            } else {
                // If no other filters are active, the context is all products in the category.
                productIdsQuery = `SELECT id FROM products WHERE category_id = ?`;
                productIdsParams = [categoryId];
            }

            const [productRows] = await db.query(productIdsQuery, productIdsParams);
            if (productRows.length === 0) {
                continue; // If the context results in no products, this filter can't have options.
            }
            const productIds = productRows.map(p => p.id);

            // With this product list, get all distinct values for the attribute we're currently processing.
            const attributeValuesSql = `
                SELECT DISTINCT pa.value
                FROM product_attributes pa
                JOIN attributes a ON pa.attribute_id = a.id
                WHERE a.name = ? AND pa.product_id IN (?)
            `;
            const [valueRows] = await db.query(attributeValuesSql, [attributeNameToGetOptionsFor, productIds]);

            if (valueRows.length > 0) {
                const attributeValues = valueRows.map(r => r.value);
                attributeValues.sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }));
                finalFilters.push({
                    attributeName: attributeNameToGetOptionsFor,
                    attributeValues: attributeValues
                });
            }
        }

        return finalFilters;
    }
};

module.exports = Attribute;