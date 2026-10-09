import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Navbar } from "./Components/Navbar";
import { Home } from "./Components/Home";
import Login from "./Components/Login";
import { Ask } from "./Components/Ask";
import SignUp from "./Components/SignUp";
import { About } from "./Components/About";
import { ProtectedRoute } from "./Components/ProtectRoute";
import Dashboard from "./Components/Dashboard";
import { startTokenExpiryWatcher } from "./utils/auth";

function App() {
  useEffect(() => {
    const cleanupWatcher = startTokenExpiryWatcher();
    return () => {
      if (cleanupWatcher) cleanupWatcher();
    };
  }, []);

  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
    path="/ask"
    element={
        <ProtectedRoute>
            <Ask />
        </ProtectedRoute>
    }
/>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/about" element={<About />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;