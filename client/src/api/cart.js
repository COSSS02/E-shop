const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
    }
    return data;
};

export const getCart = async (token) => {
    const response = await fetch('/api/cart', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
};

export const addToCart = async (productId, quantity, token) => {
    const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, quantity })
    });
    return handleResponse(response);
};

export const updateCartItem = async (productId, quantity, token) => {
    const response = await fetch(`/api/cart/${productId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity })
    });
    return handleResponse(response);
};

export const removeFromCart = async (productId, token) => {
    const response = await fetch(`/api/cart/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
};

export const placeOrder = async (addressIds, token) => {
    const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addressIds)
    });
    return handleResponse(response);
};

export const getMyOrders = async (token) => {
    const response = await fetch('/api/orders/my-orders', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
};