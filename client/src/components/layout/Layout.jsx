import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../navbar/Navbar';

const Layout = ({ children }) => {
    const location = useLocation();

    // Define the paths where the Navbar should NOT be shown
    const noNavbarPaths = ['/login', '/register'];

    // Check if the current path is in the noNavbarPaths array
    const showNavbar = !noNavbarPaths.includes(location.pathname);

    return (
        <>
            {showNavbar && <Navbar />}
            <main className="container">{children}</main>
            {/* {showNavbar && <Footer />} */}
        </>
    );
};

export default Layout;