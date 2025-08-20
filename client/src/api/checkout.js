const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
    }
    return data;
};

/**
 * Calls the backend to create a Stripe Checkout session.
 * @param {string} token - The user's auth token.
 * @param {object} addressIds - Object containing shippingAddressId and billingAddressId.
 * @returns {Promise<{id: string}>} The session object with an ID.
 */
export const createCheckoutSession = async (token, addressIds) => {
    const response = await fetch('/api/checkout/create-checkout-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addressIds)
    });
    return handleResponse(response);
};

/**
 * Verifies a Stripe session and fulfills the order on the backend.
 * @param {string} sessionId - The ID of the Stripe Checkout session.
 * @param {string} token - The user's auth token.
 * @returns {Promise<{message: string, orderId: number}>}
 */
export const fulfillOrder = async (sessionId, token) => {
    const response = await fetch('/api/checkout/fulfill-order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId })
    });
    return handleResponse(response);
};