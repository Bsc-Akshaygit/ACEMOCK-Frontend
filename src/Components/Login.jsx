import { useState, useEffect } from "react";
import "../ComponentStyles/Login.css";
import { useNavigate, useLocation } from "react-router-dom";
import { setAuthTokens } from "../utils/auth";

// Simple SVG Icon Components to avoid external dependencies
const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [sessionMessage, setSessionMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedMessage = sessionStorage.getItem("authMessage");
    const navMessage = location.state?.message;
    const msg = storedMessage || navMessage;
    if (msg) {
      setSessionMessage(msg);
      sessionStorage.removeItem("authMessage");
    }
  }, [location]);

  function navigateToSignUp() {
    navigate("/signup");
  }

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    return newErrors;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error for that specific field when user types
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  const validationErrors = validate();

  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    return;
  }

  setErrors({});
  setLoading(true);

  try {
    const response = await fetch("http://localhost:8080/aiplat/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password
      })
    });

    // Don't blindly call response.json()
    const text = await response.text();

    let result = {};

    if (text) {
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error("Response was not valid JSON:", text);
      }
    }

    console.log("Status:", response.status);
    console.log("Response:", result);

    if (response.ok) {
      setAuthTokens(result.accessToken, result.refreshToken);

      alert("Login successful!");
      navigate("/ask");
    } else {
      console.error("Login failed:", response.status, result);

      alert(
        result.message ||
        result.error ||
        `Login failed. Server returned ${response.status}`
      );
    }

  } catch (error) {
    console.error("Network error:", error);
    alert("Unable to connect to the server.");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 className="login-title">Welcome Back</h2>

        {sessionMessage && (
          <div className="login-session-expired-banner">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{sessionMessage}</span>
          </div>
        )}

        <div className="form-group">
          <label>Email Address</label>
          <div className="input-wrapper">
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "input-error" : ""}
            />
            <EmailIcon />
          </div>
          {errors.email && <span className="error">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label>Password</label>
          <div className="input-wrapper">
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? "input-error" : ""}
            />
            <LockIcon />
          </div>
          {errors.password && <span className="error">{errors.password}</span>}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="form-footer">
          <a href="#">Forgot Password?</a>
          <p className="not-account">Don't have an Account</p>
          <button onClick={() => navigateToSignUp()}>Sign Up</button>
        </div>
      </form>
    </div>
  );
};

export default Login;