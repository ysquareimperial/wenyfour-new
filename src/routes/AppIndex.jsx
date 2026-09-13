// src/routes/AppIndex.jsx
import React from "react";
import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AppLayout.css";

// Shared shell for every "logged in" page (search-ride, dashboards,
// complete-profile). Mirrors the AppIndex/Outlet pattern from your sample —
// just simplified since this app doesn't have the left/right menu columns.
export default function AppIndex() {
  const { user, logout } = useAuth();

  return (
    <div className="app_shell">
      <header className="app_topbar">
        <Link to="/" className="app_brand">
          <img
            src="https://res.cloudinary.com/dx5ilizca/image/upload/v1700895319/Galaxy__2_-removebg-preview_w1jyje.png"
            alt="wenyfour"
          />
        </Link>

        {user && (
          <div className="app_topbar_right">
            {user.is_driver && <span className="app_role_badge">Driver</span>}
            <button type="button" className="link_btn" onClick={logout}>
              Log out
            </button>
          </div>
        )}
      </header>

      <main className="app_content">
        <Outlet />
      </main>
    </div>
  );
}