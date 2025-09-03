const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
    }
    return data;
};

// export const placeOrder = async (addressIds, token) => {
//     const response = await fetch('/api/orders', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify(addressIds)
//     });
//     return handleResponse(response);
// };

export const getMyOrders = async (token) => {
    const response = await fetch('/api/orders/', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
};

export const getProviderOrderItems = async (token) => {
    const response = await fetch('/api/orders/provider', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
};

export const updateOrderItemStatus = async (itemId, status, token) => {
    const response = await fetch(`/api/orders/items/${itemId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
    });
    return handleResponse(response);
};

/**
 * (Admin) Fetches all orders from the platform with pagination and search.
 * @param {number} page - The page number to fetch.
 * @param {string} sort - The sorting preference (e.g., 'created_at-desc').
 * @param {string} searchTerm - The term to search for.
 * @param {string} token - The admin's auth token.
 * @returns {Promise<object>} The API response with orders and pagination.
 */
export const getAllOrders = async (page, sort, searchTerm, token) => {
    const url = `/api/orders/all?page=${page}&sort=${sort}&q=${encodeURIComponent(searchTerm)}`;
    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
};

export const deleteOrder = async (orderId, token) => {
    const url = `/api/orders/${orderId}`;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
};