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
            const { provider_id, category_id, name, description, price, stock_quantity, discount_price, discount_start_date, discount_end_date } = productData;
            const productSql = `
                INSERT INTO products (provider_id, category_id, name, description, price, stock_quantity, discount_price, discount_start_date, discount_end_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [productResult] = await connection.query(productSql, [provider_id, category_id, name, description, price, stock_quantity, discount_price, discount_start_date, discount_end_date]);
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
     * @param {number} user - The authenticated user object (containing id and role).
     * @param {object} productData - The core product data to update.
     * @param {Array<object>} attributesData - The new set of attributes for the product.
     * @returns {Promise<boolean>} True on success.
     */
    async update(productId, user, productData, attributesData) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Security Check: Verify the user owns the product before updating.
            const [productRows] = await connection.query('SELECT provider_id FROM products WHERE id = ?', [productId]);
            if (productRows.length === 0) throw new Error("Product not found.");
            if (user.role !== 'admin' && productRows[0].provider_id !== user.id) throw new Error("User not authorized to edit this product.");

            // 1. Update the core product details
            const {
                name, description, price, stock_quantity, category_id,
                discount_price, discount_start_date, discount_end_date
            } = productData;

            const productUpdateSql = `
                UPDATE products SET
                    name = ?,
                    description = ?,
                    price = ?,
                    stock_quantity = ?,
                    category_id = ?,
                    discount_price = ?,
                    discount_start_date = ?,
                    discount_end_date = ?
                WHERE id = ?
            `;
            await connection.query(productUpdateSql, [
                name, description, price, stock_quantity, category_id,
                discount_price, discount_start_date, discount_end_date,
                productId
            ]);

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
     * (Admin) Deletes a product from the database.
     * @param {number} productId - The ID of the product to delete.
     * @returns {Promise<boolean>} True on success.
     */
    async delete(productId) {
        // The database schema should have ON DELETE CASCADE for product_attributes,
        // so they will be deleted automatically with the product.
        const [result] = await db.query('DELETE FROM products WHERE id = ?', [productId]);
        if (result.affectedRows === 0) {
            throw new Error("Product not found or already deleted.");
        }
        return true;
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

        let orderByClause;
        if (sortBy === 'discount') {
            orderByClause = `ORDER BY CASE WHEN p.discount_price IS NOT NULL AND NOW() BETWEEN p.discount_start_date AND p.discount_end_date THEN ((p.price - p.discount_price) / p.price) ELSE -1 END ${safeSortOrder}`;
        } else {
            orderByClause = `ORDER BY p.${safeSortBy} ${safeSortOrder}`;
        }

        // Get total count for the provider
        const countSql = `SELECT COUNT(*) as total FROM products WHERE provider_id = ?`;
        const [[{ total }]] = await db.query(countSql, [providerId]);

        // Get paginated products for the provider
        const productsSql = `
            SELECT
                p.id, p.name, p.description, p.price, p.stock_quantity,
                p.discount_price, p.discount_start_date, p.discount_end_date,
                c.name as category_name
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE p.provider_id = ?
            ${orderByClause}
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

        // Add special handling for discount sorting
        let orderByClause;
        if (sortBy === 'discount') {
            orderByClause = `ORDER BY CASE WHEN p.discount_price IS NOT NULL AND NOW() BETWEEN p.discount_start_date AND p.discount_end_date THEN ((p.price - p.discount_price) / p.price) ELSE -1 END ${safeSortOrder}`;
        } else {
            orderByClause = `ORDER BY p.${safeSortBy} ${safeSortOrder}`;
        }

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
                p.discount_price, p.discount_start_date, p.discount_end_date,
                c.name as category_name
            FROM products p
            JOIN categories c ON p.category_id = c.id
            ${commonWhereClause}
            ${orderByClause}
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

        let orderByClause;
        if (sortBy === 'discount') {
            orderByClause = `ORDER BY CASE WHEN p.discount_price IS NOT NULL AND NOW() BETWEEN p.discount_start_date AND p.discount_end_date THEN ((p.price - p.discount_price) / p.price) ELSE -1 END ${safeSortOrder}`;
        } else {
            orderByClause = `ORDER BY p.${safeSortBy} ${safeSortOrder}`;
        }

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
                p.discount_price, p.discount_start_date, p.discount_end_date,
                c.name as category_name
            ${baseQuery}
            ${orderByClause}
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
    async findAll(limit, offset, sortBy = 'name', sortOrder = 'ASC', searchTerm = '') {
        const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        const validSortColumns = ['name', 'price', 'created_at', 'stock_quantity'];

        let orderByClause;

        // Special handling for discount sorting
        if (sortBy === 'discount') {
            // Order by the percentage discount, but only for active discounts. Non-discounted products are ranked last.
            orderByClause = `ORDER BY CASE WHEN p.discount_price IS NOT NULL AND NOW() BETWEEN p.discount_start_date AND p.discount_end_date THEN ((p.price - p.discount_price) / p.price) ELSE -1 END ${safeSortOrder}`;
        } else {
            const safeSortBy = validSortColumns.includes(sortBy) ? `p.${sortBy}` : 'p.name';
            orderByClause = `ORDER BY ${safeSortBy} ${safeSortOrder}`;
        }

        const whereClause = searchTerm ? `WHERE p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?` : '';
        const searchPattern = `%${searchTerm}%`;

        const countSql = `SELECT COUNT(p.id) as total FROM products p JOIN categories c ON p.category_id = c.id ${whereClause}`;
        const [countRows] = await db.query(countSql, searchTerm ? [searchPattern, searchPattern, searchPattern] : []);
        const totalProducts = countRows[0].total;

        // The SELECT statement already includes the discount fields, which is correct.
        const productsSql = `
            SELECT
                p.id, p.name, p.description, p.price, p.stock_quantity,
                p.discount_price, p.discount_start_date, p.discount_end_date,
                c.name as category_name,
                u.first_name as provider_first_name,
                u.last_name as provider_last_name,
                u.company_name as provider_company_name
            FROM products p
            JOIN categories c ON p.category_id = c.id
            JOIN users u ON p.provider_id = u.id
            ${whereClause}
            ${orderByClause}
            LIMIT ?
            OFFSET ?;
        `;

        const finalQueryParams = searchTerm
            ? [searchPattern, searchPattern, searchPattern, limit, offset]
            : [limit, offset];

        const [products] = await db.query(productsSql, finalQueryParams);

        return { products, totalProducts };
    },

    /**
     * Finds products for a provider that are below a certain stock threshold.
     * @param {number} providerId - The ID of the provider.
     * @param {number} threshold - The stock quantity to check against.
     * @returns {Promise<Array>} A list of low-stock products.
     */
    async getLowStock(providerId, threshold = 5) {
        const sql = `
            SELECT id, name, stock_quantity
            FROM products
            WHERE provider_id = ? AND stock_quantity <= ? AND stock_quantity > 0
            ORDER BY stock_quantity ASC;
        `;
        const [products] = await db.query(sql, [providerId, threshold]);
        return products;
    },

    /**
     * Finds the top-selling products for a provider.
     * @param {number} providerId - The ID of the provider.
     * @param {number} limit - The number of products to return.
     * @returns {Promise<Array>} A list of top-selling products.
     */
    async getTopSellers(providerId, limit = 5) {
        const sql = `
            SELECT
                p.id,
                p.name,
                SUM(oi.quantity) as total_sold
            FROM products p
            JOIN order_items oi ON p.id = oi.product_id
            WHERE p.provider_id = ? AND oi.status NOT IN ('Cancelled', 'Pending')
            GROUP BY p.id, p.name
            ORDER BY total_sold DESC
            LIMIT ?;
        `;
        const [products] = await db.query(sql, [providerId, limit]);
        return products;
    },

    /**
     * (Admin) Gets platform-wide product statistics.
     */
    async getPlatformStats() {
        const [[stats]] = await db.query(`
            SELECT
                COUNT(*) as totalProducts,
                SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as outOfStockCount
            FROM products
        `);
        return stats;
    }
};

module.exports = Product;