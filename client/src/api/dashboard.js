const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
    }
    return data;
};


export const getProviderDashboard = async (token) => {
    const response = await fetch('/api/dashboard/provider', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
};