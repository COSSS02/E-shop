import { useAuth } from '../contexts/AuthContext';

const getAuthHeader = (token) => {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const getMyAddresses = async (token) => {
    const response = await fetch('/api/address', {
        headers: getAuthHeader(token)
    });
    if (!response.ok) throw new Error('Failed to fetch addresses.');
    return await response.json();
};

export const createAddress = async (addressData, token) => {
    const response = await fetch('/api/address', {
        method: 'POST',
        headers: getAuthHeader(token),
        body: JSON.stringify(addressData)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create address.');
    }
    return await response.json();
};