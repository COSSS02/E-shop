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
     * Searches for products by name or description.
     * @param {string} searchTerm - The term to search for.
     * @returns {Promise<Array>} An array of matching product objects.
     */
    async search(searchTerm) {
        const sql = `
            SELECT
                p.id, p.name, p.description, p.price, p.stock_quantity,
                c.name as category_name
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?
            ORDER BY p.created_at DESC
        `;
        const searchPattern = `%${searchTerm}%`;
        const [rows] = await db.query(sql, [searchPattern, searchPattern, searchPattern]);
        return rows;
    },

    /**
     * Finds all products belonging to a specific category name.
     * @param {string} categoryName - The name of the category.
     * @returns {Promise<Array>} An array of product objects.
     */
    async findByCategoryName(categoryName) {
        const sql = `
            SELECT
                p.id, p.name, p.description, p.price, p.stock_quantity,
                c.name as category_name
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE c.name = ?
            ORDER BY p.created_at DESC
        `;
        const [rows] = await db.query(sql, [categoryName]);
        return rows;
    },

       /**
     * Finds all products.
     * @returns {Promise<Array>} An array of product objects.
     */
    async findAll() {
        // This query joins to get the category name and a product image if you add an images table later.
        const sql = `
            SELECT
                p.id, p.name, p.description, p.price, p.stock_quantity,
                c.name as category_name
            FROM products p
            JOIN categories c ON p.category_id = c.id
            ORDER BY p.created_at DESC
        `;
        const [rows] = await db.query(sql);
        return rows;
    }
};

module.exports = Product;