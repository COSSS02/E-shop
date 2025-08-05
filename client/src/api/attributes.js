export const getCategoryFilters = async (categoryName) => {
    try {
        const response = await fetch(`/api/attributes/filters/category/${encodeURIComponent(categoryName)}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch filters for category ${categoryName}:`, error);
        throw error;
    }
};

export const getAttributesByCategoryId = async (categoryId, token) => {
    try {
        const response = await fetch(`/api/attributes/category/${categoryId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch attributes for category ${categoryId}:`, error);
        throw error;
    }
};