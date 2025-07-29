export const getAllProducts = async () => {
    try {
        // The browser will request this from the Vite server, which proxies it.
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch products:", error);
        throw error;
    }
};

export const getProductById = async (productId) => {
    try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch product with ID ${productId}:`, error);
        throw error;
    }
}

export const getProductsByCategory = async (categoryName) => {
    try {
        const response = await fetch(`/api/products/category/${encodeURIComponent(categoryName)}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch products for category ${categoryName}:`, error);
        throw error;
    }
};

export const searchProducts = async (query) => {
    try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error(`Failed to search for products with query "${query}":`, error);
        throw error;
    }
};

export const createProduct = async (productPayload, token) => {
    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productPayload)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to create product.');
        }
        return data;
    } catch (error) {
        console.error("Failed to create product:", error);
        throw error;
    }
};