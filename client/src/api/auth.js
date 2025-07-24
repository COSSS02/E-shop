export const registerUser = async (userData) => {
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (!response.ok) {
            // Throw an error with the message from the backend
            throw new Error(data.message || 'Failed to register');
        }

        return data;
    } catch (error) {
        console.error("Registration failed:", error);
        throw error; // Re-throw the error to be caught by the component
    }
};

export const loginUser = async (credentials) => {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to log in');
        }

        return data; // This will include the token and user info
    } catch (error) {
        console.error("Login failed:", error);
        throw error;
    }
};

export const upgradeToProvider = async (providerData, token) => {
    const response = await fetch('/api/auth/upgrade-to-provider', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(providerData)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upgrade account.');
    }
    return await response.json();
};