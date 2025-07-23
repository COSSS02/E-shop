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