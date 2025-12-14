// src/pages/login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./assets/styles/loginstyle.css";
import vitlogo from "./assets/images/vitlogo.png";
import background from "./assets/images/vitimage.jpeg";
import ImageSlider from "./components/ImageSlider";

// map numeric role_id from backend -> route slug you use in the app
const ROLE_SLUG = {
  "1": "student",
  "2": "faculty",
  "3": "warden",
  "4": "security",
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const togglePassword = () => setShowPassword((s) => !s);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:4000/api/auth/login", {
        username,
        password,
      });

      if (!res.data?.ok) {
        alert("❌ Invalid credentials");
        setLoading(false);
        return;
      }

const { token, me } = res.data; // backend sends roles like ["faculty"] (slug) or ["2"] (id)
const roles = Array.isArray(me?.roles) ? me.roles : [];
let roleSlug = "student";
if (roles.length) {
  const r0 = String(roles[0]).toLowerCase();
  roleSlug = ROLE_SLUG[r0] || r0;  // if numeric ("2") -> "faculty"; if slug ("faculty") -> "faculty"
}

// Persist auth
localStorage.setItem("token", token);
localStorage.setItem("userRole", roleSlug);
localStorage.setItem("username", me.username || "");
localStorage.setItem("vitId", me.vit_id || "");

// default auth header
axios.defaults.headers.common.Authorization = `Bearer ${token}`;

// Optional: route by strongest role if multiple
if (roles.includes("faculty") || roleSlug === "faculty") {
  navigate("/faculty");
} else if (roles.includes("warden") || roleSlug === "warden") {
  navigate("/warden");
} else if (roles.includes("security") || roleSlug === "security") {
  navigate("/security");
} else {
  navigate("/student");
}

      setTimeout(() => {
        if (window.location.pathname === "/login") {
          window.location.assign(`/${roleSlug}`);
        }
      }, 300);

    } catch (err) {
      console.error(err);
      alert("⚠️ Server error. Is the backend running on :4000?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        backgroundImage: `linear-gradient(to right, rgba(44,62,80,0.6), rgba(52,152,219,0.6)), url(${background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "grid",
        placeItems: "center",
        fontFamily: "'Inter', sans-serif",
        color: "#1d2222",
      }}
    >
      <div className="card-login">
        <div className="content">
          <img src={vitlogo} alt="VIT Logo" />

          <form onSubmit={handleLogin}>
            <div className="input-container">
              <input
                type="text"
                placeholder=" "
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
              <label>Enter Username</label>
              <span className="input-icon">&#128100;</span>
            </div>

            <div className="input-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder=" "
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <label>Enter Password</label>
              <span className="toggle-password" onClick={togglePassword}>
                {showPassword ? "🙈" : "🔒"}
              </span>
            </div>

            <button type="submit" disabled={loading}>
              <span className={`spinner ${loading ? "" : "hidden"}`}></span>
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <div className="link-under-button">
              <a href="https://vtop.vit.ac.in/" target="_blank" rel="noreferrer">
                Go to VTOP  

              </a>
              <br></br>
              <br></br>
              <a href="https://agent.hellotars.com/conv/zTScAl" target="_blank" rel="noreferrer">Go to ChatBot</a>
            </div>
          </form>
        </div>

        <div className="slider-wrapper">
          <ImageSlider />
        </div>
      </div>
    </div>
  );
}
