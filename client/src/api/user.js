const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
    }
    return data;
};

export const changePassword = async (passwords, token) => {
    const response = await fetch('/api/users/password', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(passwords)
    });
    return handleResponse(response);
};

export const deleteAccount = async (password, token) => {
    const response = await fetch('/api/users/me', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
    });
    return handleResponse(response);
};