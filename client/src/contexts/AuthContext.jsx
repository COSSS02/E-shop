import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginUser as apiLogin } from '../api/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        if (token) {
            try {
                // The token payload is the second part, after the first dot.
                const payload = JSON.parse(atob(token.split('.')[1]));
                // Check if the token is expired
                if (payload.exp * 1000 > Date.now()) {
                    setUser({
                        id: payload.id,
                        email: payload.email,
                        role: payload.role,
                        firstName: payload.firstName,
                        lastName: payload.lastName,
                        companyName: payload.companyName
                    });
                } else {
                    // Token is expired, clear it
                    localStorage.removeItem('token');
                    setToken(null);
                }
            } catch (e) {
                console.error("Invalid token found", e);
                localStorage.removeItem('token');
            }
        }
    }, [token]);

    const login = async (email, password) => {
        const data = await apiLogin({ email, password });
        setToken(data.token);
        localStorage.setItem('token', data.token);
        return data.user;
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
    };

    const value = {
        user,
        token,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};