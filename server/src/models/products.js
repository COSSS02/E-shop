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
     * @returns {Promise<object>} An object containing the products array and the total count for that category.
     */
    async findByCategoryName(categoryName, limit, offset, sortBy = 'name', sortOrder = 'ASC') {
        // Whitelist for security
        const allowedSortBy = ['name', 'price', 'stock_quantity', 'created_at'];
        const allowedSortOrder = ['ASC', 'DESC'];
        const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'name';
        const safeSortOrder = allowedSortOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

        // Get total count for the specific category
        const countSql = `
            SELECT COUNT(*) as total
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE c.name = ?
        `;
        const [[{ total }]] = await db.query(countSql, [categoryName]);

        // Get paginated products for the category with dynamic sorting
        const productsSql = `
            SELECT
                p.id, p.name, p.description, p.price, p.stock_quantity,
                c.name as category_name
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE c.name = ?
            ORDER BY ${safeSortBy} ${safeSortOrder}
            LIMIT ?
            OFFSET ?
        `;
        const [products] = await db.query(productsSql, [categoryName, limit, offset]);

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