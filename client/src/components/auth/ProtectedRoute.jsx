import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function ProtectedRoute({ children, roles }) {
    const { user, token } = useAuth();
    const location = useLocation();

    // If we don't have a token, we are definitely not logged in.
    if (!token) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to. This allows us to send them back after they log in.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!user) {
        return <div>Loading...</div>; // Or a proper loading spinner
    }

    if (roles && !roles.includes(user.role)) {
        // The user is logged in but does not have permission.
        // Redirect them to the homepage.
        return <Navigate to="/" replace />;
    }

    // If we have a token, the user object might still be loading.
    // You can add a loading spinner here if you want.
    // For now, we render the children once the user object is available.
    return children;
}

export default ProtectedRoute;