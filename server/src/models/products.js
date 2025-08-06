const db = require('../config/db');

const Product = {
    /**
     * Creates a new product along with its variable attributes.
     * This uses a transaction to ensure all or nothing is inserted.
     * @param {object} productData - Core product data.
     * @param {Array<object>} attributesData - Array of { attributeName, value }.
     * @returns {Promise<number>} The ID of the newly created product.
     */
    async create(productData, attributesData) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Insert the core product
            const { provider_id, category_id, name, description, price, stock_quantity } = productData;
            const productSql = `
                INSERT INTO products (provider_id, category_id, name, description, price, stock_quantity)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const [productResult] = await connection.query(productSql, [provider_id, category_id, name, description, price, stock_quantity]);
            const productId = productResult.insertId;

            // 2. Handle the attributes
            for (const attr of attributesData) {
                // Skip if attribute name or value is empty
                if (!attr.attributeName || !attr.value) continue;

                // Capitalize the first letter of each word in the attribute name
                const capitalizedAttrName = attr.attributeName
                    .toLowerCase()
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');

                // Find or create the attribute's ID, now scoped to the product's category
                let [rows] = await connection.query(
                    'SELECT id FROM attributes WHERE name = ? AND category_id = ?',
                    [attr.attributeName, category_id]
                );
                let attributeId;
                if (rows.length === 0) {
                    // Create the attribute, now including the category_id
                    const [attrResult] = await connection.query(
                        'INSERT INTO attributes (name, category_id) VALUES (?, ?)',
                        [attr.attributeName, category_id]
                    );
                    attributeId = attrResult.insertId;
                } else {
                    attributeId = rows[0].id;
                }

                // 3. Insert the product-attribute value link
                const valueSql = `
                    INSERT INTO product_attributes (product_id, attribute_id, value)
                    VALUES (?, ?, ?)
                `;
                await connection.query(valueSql, [productId, attributeId, attr.value]);
            }

            await connection.commit();
            return productId;

        } catch (error) {
            await connection.rollback();
            console.error("Error creating product:", error);
            throw error; // Re-throw the error to be handled by the controller
        } finally {
            connection.release();
        }
    },

    /**
     * Updates an existing product and its attributes.
     * @param {number} productId - The ID of the product to update.
     * @param {number} userId - The ID of the user attempting the update (for authorization).
     * @param {object} productData - The core product data to update.
     * @param {Array<object>} attributesData - The new set of attributes for the product.
     * @returns {Promise<boolean>} True on success.
     */
    async update(productId, userId, productData, attributesData) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Security Check: Verify the user owns the product before updating.
            const [productRows] = await connection.query('SELECT provider_id FROM products WHERE id = ?', [productId]);
            if (productRows.length === 0) throw new Error("Product not found.");
            if (productRows[0].provider_id !== userId) throw new Error("User not authorized to edit this product.");

            // 1. Update the core product details
            await connection.query('UPDATE products SET ? WHERE id = ?', [productData, productId]);

            // 2. Delete all old attributes for this product
            await connection.query('DELETE FROM product_attributes WHERE product_id = ?', [productId]);

            // 3. Re-insert the new/updated attributes (similar to the create method)
            for (const attr of attributesData) {
                if (!attr.attributeName || !attr.value) continue;

                const capitalizedAttrName = attr.attributeName.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

                let [rows] = await connection.query('SELECT id FROM attributes WHERE name = ? AND category_id = ?', [capitalizedAttrName, productData.category_id]);
                let attributeId;

                if (rows.length > 0) {
                    attributeId = rows[0].id;
                } else {
                    const [newAttrResult] = await connection.query('INSERT INTO attributes (name, category_id) VALUES (?, ?)', [productData.category_id, capitalizedAttrName]);
                    attributeId = newAttrResult.insertId;
                }

                await connection.query('INSERT INTO product_attributes (product_id, attribute_id, value) VALUES (?, ?, ?)', [productId, attributeId, attr.value]);
            }

            await connection.commit();
            return true;

        } catch (error) {
            await connection.rollback();
            console.error("Error updating product:", error);
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Finds a single product by its ID and retrieves all its attributes.
     * @param {number} productId - The ID of the product.
     * @returns {Promise<object|null>} The product object with an 'attributes' array, or null.
     */
    async findById(productId) {
        // 1. Get the core product details
        const productSql = `
            SELECT p.*, c.name as category_name, u.company_name as provider_name
            FROM products p
            JOIN categories c ON p.category_id = c.id
            JOIN users u ON p.provider_id = u.id
            WHERE p.id = ?
        `;
        const [productRows] = await db.query(productSql, [productId]);

        if (productRows.length === 0) {
            return null;
        }

        const product = productRows[0];

        // 2. Get all attributes for that product
        const attributesSql = `
        SELECT a.name, pa.value
        FROM product_attributes pa
        JOIN attributes a ON pa.attribute_id = a.id
        WHERE pa.product_id = ?
    `;
        const [attributeRows] = await db.query(attributesSql, [productId]);

        product.attributes = attributeRows; // Attach attributes to the product object
        return product;
    },

    /**
     * Finds all products for a specific provider with pagination and sorting.
     * @param {number} providerId - The ID of the provider.
     * @param {number} limit - The number of products to return per page.
     * @param {number} offset - The number of products to skip.
     * @param {string} sortBy - The column to sort by.
     * @param {string} sortOrder - The sort order ('ASC' or 'DESC').
     * @returns {Promise<object>} An object containing the products array and the total count.
     */
    async findByProviderId(providerId, limit, offset, sortBy = 'name', sortOrder = 'ASC') {
        // Whitelist for security
        const allowedSortBy = ['name', 'price', 'stock_quantity', 'created_at'];
        const allowedSortOrder = ['ASC', 'DESC'];
        const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'name';
        const safeSortOrder = allowedSortOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

        // Get total count for the provider
        const countSql = `SELECT COUNT(*) as total FROM products WHERE provider_id = ?`;
        const [[{ total }]] = await db.query(countSql, [providerId]);

        // Get paginated products for the provider
        const productsSql = `
            SELECT
                p.id, p.name, p.description, p.price, p.stock_quantity,
                c.name as category_name
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE p.provider_id = ?
            ORDER BY ${safeSortBy} ${safeSortOrder}
            LIMIT ?
            OFFSET ?
        `;
        const [products] = await db.query(productsSql, [providerId, limit, offset]);

        return { products, totalProducts: total };
    },

    /**
     * Searches for products by name or description with pagination and sorting.
     * @param {string} searchTerm - The term to search for.
     * @param {number} limit - The number of products to return per page.
     * @param {number} offset - The number of products to skip.
     * @param {string} sortBy - The column to sort by.
     * @param {string} sortOrder - The sort order ('ASC' or 'DESC').
     * @returns {Promise<object>} An object containing the products array and the total count.
     */
    async search(searchTerm, limit, offset, sortBy = 'name', sortOrder = 'ASC') {
        const searchPattern = `%${searchTerm}%`;
        const commonWhereClause = `WHERE p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?`;

        // Whitelist for security
        const allowedSortBy = ['name', 'price', 'stock_quantity', 'created_at'];
        const allowedSortOrder = ['ASC', 'DESC'];
        const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'name';
        const safeSortOrder = allowedSortOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

        // First, get the total count of matching products
        const countSql = `
            SELECT COUNT(*) as total
            FROM products p
            JOIN categories c ON p.category_id = c.id
            ${commonWhereClause}
        `;
        const [[{ total }]] = await db.query(countSql, [searchPattern, searchPattern, searchPattern]);

        // Then, get the paginated list of products with dynamic sorting
        const productsSql = `
            SELECT
                p.id, p.name, p.description, p.price, p.stock_quantity,
                c.name as category_name
            FROM products p
            JOIN categories c ON p.category_id = c.id
            ${commonWhereClause}
            ORDER BY ${safeSortBy} ${safeSortOrder}
            LIMIT ?
            OFFSET ?
        `;
        const [products] = await db.query(productsSql, [searchPattern, searchPattern, searchPattern, limit, offset]);

        return { products, totalProducts: total };
    },

    /**
     * Finds all products belonging to a specific category name with pagination and sorting.
     * @param {string} categoryName - The name of the category.
     * @param {number} limit - The number of products to return per page.
     * @param {number} offset - The number of products to skip.
     * @param {string} sortBy - The column to sort by.
     * @param {string} sortOrder - The sort order ('ASC' or 'DESC').
     * @param {object} filters - An object of filters, e.g., { Color: 'Red', Size: 'M' }.
     * @returns {Promise<object>} An object containing the products array and the total count for that category.
     */
    async findByCategoryName(categoryName, limit, offset, sortBy = 'name', sortOrder = 'ASC', filters = {}) {
        // Whitelist for security
        const allowedSortBy = ['name', 'price', 'stock_quantity', 'created_at'];
        const allowedSortOrder = ['ASC', 'DESC'];
        const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'name';
        const safeSortOrder = allowedSortOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

        let filterClauses = '';
        let filterValues = [];
        const filterKeys = Object.keys(filters);

        if (filterKeys.length > 0) {
            const subquery = `
                SELECT pa.product_id
                FROM product_attributes pa
                JOIN attributes a ON pa.attribute_id = a.id
                WHERE (a.name, pa.value) IN (?)
                GROUP BY pa.product_id
                HAVING COUNT(DISTINCT a.name) = ?
            `;
            const filterPairs = filterKeys.map(key => [key, filters[key]]);
            filterClauses = `AND p.id IN (${subquery})`;
            filterValues.push(filterPairs, filterKeys.length);
        }

        const baseQuery = `
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE c.name = ? ${filterClauses}
        `;

        // Get total count for the specific category with filters
        const countSql = `SELECT COUNT(*) as total ${baseQuery}`;
        const [[{ total }]] = await db.query(countSql, [categoryName, ...filterValues]);

        // Get paginated products for the category with dynamic sorting and filters
        const productsSql = `
            SELECT
                p.id, p.name, p.description, p.price, p.stock_quantity,
                c.name as category_name
            ${baseQuery}
            ORDER BY ${safeSortBy} ${safeSortOrder}
            LIMIT ?
            OFFSET ?
        `;
        const [products] = await db.query(productsSql, [categoryName, ...filterValues, limit, offset]);

        return { products, totalProducts: total };
    },

    /**
         * Finds all products with pagination and sorting.
     * @param {number} limit - The number of products to return per page.
     * @param {number} offset - The number of products to skip.
     * @param {string} sortBy - The column to sort by.
     * @param {string} sortOrder - The sort order ('ASC' or 'DESC').
     * @returns {Promise<object>} An object containing the products array and the total count.
     */
    async findAll(limit, offset, sortBy = 'name', sortOrder = 'ASC') {
        // Whitelist of allowed columns for sorting to prevent SQL injection
        const allowedSortBy = ['name', 'price', 'stock_quantity', 'created_at'];
        const allowedSortOrder = ['ASC', 'DESC'];

        // Validate and sanitize sort parameters, defaulting to 'newest'
        const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'name';
        const safeSortOrder = allowedSortOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

        // First, get the total count of all products for pagination metadata
        const countSql = `SELECT COUNT(*) as total FROM products`;
        const [[{ total }]] = await db.query(countSql);

        // Then, get the paginated list of products with dynamic sorting
        const productsSql = `
            SELECT
                p.id, p.name, p.description, p.price, p.stock_quantity,
                c.name as category_name
            FROM products p
            JOIN categories c ON p.category_id = c.id
            ORDER BY ${safeSortBy} ${safeSortOrder}
            LIMIT ?
            OFFSET ?
        `;
        const [products] = await db.query(productsSql, [limit, offset]);

        return { products, totalProducts: total };
    }
};

module.exports = Product;