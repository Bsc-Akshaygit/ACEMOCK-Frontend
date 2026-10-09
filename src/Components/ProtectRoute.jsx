import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated, isRefreshTokenExpired, logoutAndAskForLogin } from "../utils/auth";

export const ProtectedRoute = ({ children }) => {
    const location = useLocation();

    if (!isAuthenticated()) {
        return <Navigate to="/login" state={{ from: location, message: "Please log in to continue." }} replace />;
    }

    if (isRefreshTokenExpired()) {
        logoutAndAskForLogin("Your session has expired. Please log in again.");
        return <Navigate to="/login" state={{ from: location, message: "Your session has expired. Please log in again." }} replace />;
    }

    return children;
};