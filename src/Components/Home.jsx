import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../ComponentStyles/Home.css";
import { isAuthenticated, isRefreshTokenExpired, clearAuthTokens } from "../utils/auth";

export function Home() {

    const navigate = useNavigate();

    function navigateToLogin() {
        navigate("/login");
    }

    useEffect(() => {
        if (isAuthenticated()) {
            if (isRefreshTokenExpired()) {
                clearAuthTokens();
            } else {
                navigate("/ask");
            }
        }
    }, [navigate]);

    return (
        <div className="home-page">

            <div className="floating-shape shape-1"></div>
            <div className="floating-shape shape-2"></div>
            <div className="floating-shape shape-3"></div>

            <section className="hero">

                <span className="hero-badge">
                    ✨ AI Powered Interview Platform
                </span>

                <h1 className="hero-title">
                    Master Every <br />
                    <span>Interview</span> with AI
                </h1>

                <p className="hero-description">
                    Practice real-world interview questions, receive instant
                    personalized feedback, and improve your confidence with an
                    intelligent AI interviewer built to help you succeed.
                </p>

                <div className="hero-buttons">

                    <button
                        className="get-start"
                        onClick={navigateToLogin}
                    >
                        Get Started
                    </button>

                    <button className="learn-more">
                        Learn More
                    </button>

                </div>

            </section>

        </div>
    );
}