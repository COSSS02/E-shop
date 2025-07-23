export const getAllCategories = async () => {
    try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        throw error;
    }
};