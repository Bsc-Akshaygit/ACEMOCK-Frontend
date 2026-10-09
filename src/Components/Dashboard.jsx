import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../ComponentStyles/Dashboard.css";
import { authFetch } from "../utils/auth";

const Dashboard = () => {
    const navigate = useNavigate();

    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // =========================
    // FETCH DASHBOARD DATA
    // =========================

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await authFetch("http://localhost:8080/aiplat/dashboard");

            if (!res.ok) {
                throw new Error("Failed to fetch dashboard data");
            }

            const data = await res.json();
            setDashboardData(data);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);


    // =========================
    // HELPERS
    // =========================

    const getTotalUsers = () => {
        return dashboardData?.totalUsers ?? 0;
    };



    // =========================
    // UI
    // =========================

    return (
        <div className="dashboard-page">

            {/* ---- Header ---- */}
            <div className="dashboard-header">
                <button className="dashboard-back-btn" onClick={() => navigate("/ask")}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Back to Chat
                </button>

                <div className="dashboard-title-group">
                    <h1 className="dashboard-title">Dashboard</h1>
                    <p className="dashboard-subtitle">Platform usage at a glance</p>
                </div>

                <button className="dashboard-refresh-btn" onClick={fetchDashboard} title="Refresh">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 4 23 10 17 10" />
                        <polyline points="1 20 1 14 7 14" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                </button>
            </div>


            {/* ---- Loading ---- */}
            {loading && (
                <div className="dashboard-loading">
                    <div className="dashboard-spinner" />
                    <p>Loading dashboard...</p>
                </div>
            )}


            {/* ---- Error ---- */}
            {error && !loading && (
                <div className="dashboard-error">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}


            {/* ---- Content ---- */}
            {!loading && !error && dashboardData && (
                <div className="dashboard-content">

                    {/* ---- Stat Cards Row ---- */}
                    <div className="dashboard-cards-row">

                        {/* Total Users */}
                        <div className="dash-card dash-card--users">
                            <div className="dash-card-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" strokeWidth="1.8"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <div className="dash-card-body">
                                <span className="dash-card-label">Total Users</span>
                                <span className="dash-card-value">{getTotalUsers().toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Active Model */}
                        <div className="dash-card dash-card--requests">
                            <div className="dash-card-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" strokeWidth="1.8"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="3" width="20" height="14" rx="2" />
                                    <line x1="8" y1="21" x2="16" y2="21" />
                                    <line x1="12" y1="17" x2="12" y2="21" />
                                </svg>
                            </div>
                            <div className="dash-card-body">
                                <span className="dash-card-label">Active Model</span>
                                <span className="dash-card-value dash-card-value--model">
                                    {dashboardData.model}
                                </span>
                            </div>
                        </div>

                    </div>


                    {/* ---- Model Highlight ---- */}
                    {dashboardData.model && (
                        <div className="dashboard-section">
                            <h2 className="dashboard-section-title">Model in Use</h2>
                            <div className="model-highlight-card">
                                <div className="model-highlight-glow" />
                                <div className="model-highlight-badge">AI</div>
                                <div className="model-highlight-info">
                                    <span className="model-highlight-name">{dashboardData.model}</span>
                                    <span className="model-highlight-sub">Currently active language model</span>
                                </div>
                                <div className="model-highlight-status">
                                    <span className="model-status-dot" />
                                    Active
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            )}

        </div>
    );
};

export default Dashboard;
