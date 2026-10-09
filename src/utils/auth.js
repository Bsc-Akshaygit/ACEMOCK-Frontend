// Utility for Authentication and Token Management

export const getAccessToken = () => localStorage.getItem("accessToken");
export const getRefreshToken = () => localStorage.getItem("refreshToken");

export const setAuthTokens = (accessToken, refreshToken) => {
    if (accessToken) localStorage.setItem("accessToken", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    window.dispatchEvent(new Event("auth-changed"));
};

export const clearAuthTokens = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-changed"));
};

/**
 * Safely parse a JWT token payload without external libraries.
 */
export const parseJwt = (token) => {
    try {
        if (!token || typeof token !== "string") return null;
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
};

/**
 * Checks whether a given JWT token has expired based on its 'exp' claim.
 */
export const isTokenExpired = (token) => {
    if (!token) return true;
    const payload = parseJwt(token);
    if (!payload || typeof payload.exp !== "number") {
        // If not a JWT with exp claim, we cannot determine expiry client-side
        return false;
    }
    // Expired if current time is greater than or equal to exp (with a 2s safety buffer)
    return Date.now() >= (payload.exp * 1000 - 2000);
};

/**
 * Checks if the stored refresh token is expired.
 */
export const isRefreshTokenExpired = () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return true;
    return isTokenExpired(refreshToken);
};

/**
 * Checks if the user has valid authentication tokens.
 */
export const isAuthenticated = () => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    if (!accessToken && !refreshToken) return false;
    if (refreshToken && isTokenExpired(refreshToken)) return false;
    return true;
};

let isLoggingOut = false;

/**
 * Automatically logs the user out, clears local storage tokens,
 * notifies the user, and redirects them to the login page.
 */
export const logoutAndAskForLogin = (message = "Your session has expired. Please log in again.") => {
    if (isLoggingOut) return;
    isLoggingOut = true;

    // 1. Clear access and refresh tokens from local storage
    clearAuthTokens();

    // 2. Save notice message for the login page
    sessionStorage.setItem("authMessage", message);

    // 3. Dispatch an event for components that listen
    window.dispatchEvent(new CustomEvent("auth-session-expired", { detail: { message } }));

    // 4. Alert user and redirect to /login
    setTimeout(() => {
        try {
            alert(message);
        } catch (e) {
            console.error("Alert failed:", e);
        }

        if (window.location.pathname !== "/login") {
            window.location.href = "/login";
        }
        isLoggingOut = false;
    }, 10);
};

let refreshPromise = null;

/**
 * Calls backend to refresh the access token using the stored refresh token.
 * If the refresh token is missing or expired, logs out and redirects to /login.
 */
export const refreshAccessToken = async () => {
    const refreshToken = getRefreshToken();

    // If no refresh token or already expired locally
    if (!refreshToken || isTokenExpired(refreshToken)) {
        logoutAndAskForLogin("Your session has expired. Please log in again.");
        throw new Error("Refresh token expired");
    }

    // Reuse existing in-flight refresh promise to prevent duplicate concurrent calls
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        try {
            const res = await fetch("http://localhost:8080/aiplat/refresh", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ refreshToken }),
            });

            if (!res.ok) {
                // Refresh token is invalid/expired on the server
                logoutAndAskForLogin("Your session has expired. Please log in again.");
                throw new Error("Refresh token expired");
            }

            const data = await res.json();
            if (!data || !data.accessToken) {
                logoutAndAskForLogin("Your session has expired. Please log in again.");
                throw new Error("Invalid response from refresh endpoint");
            }

            setAuthTokens(data.accessToken, data.refreshToken || refreshToken);
            return data.accessToken;
        } catch (error) {
            if (error.message !== "Refresh token expired") {
                console.error("Error refreshing access token:", error);
                logoutAndAskForLogin("Your session has expired. Please log in again.");
            }
            throw error;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
};

/**
 * Authenticated fetch helper.
 * Automatically adds the Authorization header with Bearer token.
 * If 401 or 403 is encountered, tries to refresh the access token and retries.
 * If refresh token is expired, automatically logs out and redirects to /login.
 */
export const authFetch = async (url, options = {}) => {
    let token = getAccessToken();

    const headers = new Headers(options.headers || {});
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    let response = await fetch(url, { ...options, headers });

    // If unauthorized or forbidden, access token may be expired
    if (response.status === 401 || response.status === 403) {
        try {
            token = await refreshAccessToken();
            headers.set("Authorization", `Bearer ${token}`);
            response = await fetch(url, { ...options, headers });
        } catch (refreshErr) {
            // refreshAccessToken has already cleared tokens and triggered logoutAndAskForLogin
            throw refreshErr;
        }
    }

    return response;
};

/**
 * Background watcher for proactive token expiry detection.
 * Sets a timer for JWT expiration and listens for storage events across tabs.
 */
export const startTokenExpiryWatcher = () => {
    let expiryTimeoutId = null;
    let intervalId = null;

    const checkAndSchedule = () => {
        if (expiryTimeoutId) {
            clearTimeout(expiryTimeoutId);
            expiryTimeoutId = null;
        }

        const refreshToken = getRefreshToken();
        if (!refreshToken) return;

        const payload = parseJwt(refreshToken);
        if (!payload || typeof payload.exp !== "number") {
            return;
        }

        const expiryMs = payload.exp * 1000;
        const now = Date.now();
        const remainingMs = expiryMs - now;

        if (remainingMs <= 0) {
            logoutAndAskForLogin("Your session has expired. Please log in again.");
            return;
        }

        // Set timeout for when refresh token expires (capped at max 32-bit int)
        const delay = Math.min(remainingMs, 2147483647);
        expiryTimeoutId = setTimeout(() => {
            logoutAndAskForLogin("Your session has expired. Please log in again.");
        }, delay);
    };

    checkAndSchedule();

    // Listen for storage events (e.g., logout in another tab)
    const handleStorageChange = (e) => {
        if (e.key === "refreshToken" || e.key === "accessToken") {
            if (!getRefreshToken() && !getAccessToken()) {
                const publicPaths = ["/", "/home", "/login", "/signup", "/about"];
                if (!publicPaths.includes(window.location.pathname)) {
                    logoutAndAskForLogin("You have been logged out. Please log in again.");
                }
            } else {
                checkAndSchedule();
            }
        }
    };

    const handleAuthChanged = () => {
        checkAndSchedule();
    };

    // Periodic check every 15 seconds (catches system sleep/wake)
    intervalId = setInterval(() => {
        const refreshToken = getRefreshToken();
        if (refreshToken && isTokenExpired(refreshToken)) {
            logoutAndAskForLogin("Your session has expired. Please log in again.");
        }
    }, 15000);

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth-changed", handleAuthChanged);

    return () => {
        if (expiryTimeoutId) clearTimeout(expiryTimeoutId);
        if (intervalId) clearInterval(intervalId);
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener("auth-changed", handleAuthChanged);
    };
};
