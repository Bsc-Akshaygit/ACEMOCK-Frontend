import { useState, useEffect } from 'react';
import '../ComponentStyles/theme.css';
import '../ComponentStyles/Navbar.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { clearAuthTokens, getAccessToken } from '../utils/auth';

export const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const navigate = useNavigate();
    const location = useLocation();
    const isAskPage = location.pathname === '/ask';

    useEffect(() => {
        const updateAuthState = () => {
            const token = getAccessToken();
            setIsLoggedIn(Boolean(token));
        };

        updateAuthState();

        window.addEventListener("auth-changed", updateAuthState);
        window.addEventListener("storage", updateAuthState);

        return () => {
            window.removeEventListener("auth-changed", updateAuthState);
            window.removeEventListener("storage", updateAuthState);
        };
    }, [location.pathname]);

    function navigateToHome() {
        navigate("/home");
    }

    function navigateToAbout() {
        navigate("/about");
    }

    function navigateToLogin() {
        navigate("/login");
    }

    function navigateToSignup() {
        navigate("/signup");
    }

    const handleLogout = async () => {
        try {
            const token = getAccessToken();
            if (token) {
                await fetch("http://localhost:8080/aiplat/logout", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.error("Logout Error:", error);
        } finally {
            clearAuthTokens();
            navigate("/login");
        }
    };

    return (
        <div className='font'>
            <div className="nav-border">
                <h2>ACEMOCK</h2>
                <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle navigation">
                    <span className="bar"></span>
                    <span className="bar"></span>
                    <span className="bar"></span>
                </button>
                <ul className={`ul-list ${isOpen ? 'active' : ''}`}>
                    <li onClick={() => { navigateToHome(); }}>Home</li>
                    <li onClick={() => { navigateToAbout(); }}>About</li>
                    {!isLoggedIn && !isAskPage ? (
                        <>
                            <li onClick={() => { navigateToLogin(); }}>Login</li>
                            <li onClick={() => { navigateToSignup(); }}>Sign Up</li>
                        </>
                    ) : isLoggedIn ? (
                        <li onClick={handleLogout}>Logout</li>
                    ) : null}
                </ul>
            </div>
        </div>
    );
};

