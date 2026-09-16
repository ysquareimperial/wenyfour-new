// src/routes/AppIndex.jsx
import React, { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AppLayout.css";

/* ------------------------------------------------------------------ *
 *  Inline icons (no dependency)
 * ------------------------------------------------------------------ */

const Icon = {
  Search: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m20 20-3.6-3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  User: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="8.5" r="3.3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20c.9-3.4 3.6-5.2 7-5.2s6.1 1.8 7 5.2"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Car: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M4 15v-2.2l1.4-3.9A2 2 0 0 1 7.3 7.5h9.4a2 2 0 0 1 1.9 1.4L20 12.8V15"
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M3.5 15h17v3.2a1 1 0 0 1-1 1h-1.6a1 1 0 0 1-1-1V18H7.1v.2a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1V15Z"
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="7.5" cy="15" r=".9" fill="currentColor" />
      <circle cx="16.5" cy="15" r=".9" fill="currentColor" />
    </svg>
  ),
  Route: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.5 6h5a4.5 4.5 0 0 1 4.5 4.5v0a4.5 4.5 0 0 1-4.5 4.5h-5"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
        strokeDasharray="2 3" />
    </svg>
  ),
  Menu: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Close: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Logout: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M15 12H4M15 12l-3.5-3.5M15 12l-3.5 3.5"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 4h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
};

/* ------------------------------------------------------------------ *
 *  Nav data — one entry per protected route in AppNavigation.jsx
 * ------------------------------------------------------------------ */

const MAIN_NAV = [
  { to: "/search-ride", label: "Find a ride", icon: <Icon.Search /> },
  { to: "/my-rides",    label: "My rides",    icon: <Icon.Route />  },
  { to: "/my-cars",     label: "My cars",     icon: <Icon.Car />    },
];

const DRIVER_NAV = [
  { to: "/cars/new",      label: "Add a car",      icon: <Icon.Car />   },
  { to: "/rides/publish", label: "Publish a ride", icon: <Icon.Route /> },
];

/* ------------------------------------------------------------------ *
 *  Shell
 * ------------------------------------------------------------------ */

export default function AppIndex() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Esc to close + body scroll lock while drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setDrawerOpen(false); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const isDriver = !!(user && user.is_driver);

  const NavItems = ({ items }) => (
    <nav className="app_nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `app_nav_link${isActive ? " active" : ""}`
          }
          end
        >
          <span className="app_nav_icon" aria-hidden="true">{item.icon}</span>
          <span className="app_nav_label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="app_shell">
      {/* ----- Mobile topbar ----- */}
      <header className="app_topbar">
        <button
          type="button"
          className="app_menu_btn"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          aria-expanded={drawerOpen}
          aria-controls="app_sidebar"
        >
          <Icon.Menu />
        </button>

        <Link to="/" className="app_brand" aria-label="wenyfour home">
          <img
            src="https://res.cloudinary.com/dx5ilizca/image/upload/v1700895319/Galaxy__2_-removebg-preview_w1jyje.png"
            alt="wenyfour"
          />
        </Link>

        <div className="app_topbar_right">
          {isDriver && <span className="app_role_badge">Driver</span>}
          <button type="button" className="link_btn app_topbar_logout" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      {/* ----- Sidebar (desktop) / drawer (mobile) ----- */}
      <aside
        id="app_sidebar"
        className={`app_sidebar${drawerOpen ? " open" : ""}`}
        aria-label="Primary"
      >
        <div className="app_sidebar_head">
          <Link to="/" className="app_sidebar_brand" aria-label="wenyfour home">
            <img
              src="https://res.cloudinary.com/dx5ilizca/image/upload/v1700895319/Galaxy__2_-removebg-preview_w1jyje.png"
              alt=""
            />
          </Link>

          <button
            type="button"
            className="app_icon_btn app_sidebar_close"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation"
          >
            <Icon.Close />
          </button>
        </div>

        <div className="app_sidebar_body">
          <p className="app_nav_section_label">Rides</p>
          <NavItems items={MAIN_NAV} />

          <p className="app_nav_section_label">Driving</p>
          <NavItems items={DRIVER_NAV} />
        </div>

        <div className="app_sidebar_foot">
          {user && (
            <div className="app_user_row">
              <div className="app_user_meta">
                <span className="app_user_name">
                  {user.full_name || user.name || user.email || "Signed in"}
                </span>
                {isDriver && <span className="app_user_role">Driver</span>}
              </div>
              <button
                type="button"
                className="app_logout_btn"
                onClick={logout}
                aria-label="Log out"
                title="Log out"
              >
                <Icon.Logout />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ----- Scrim (mobile only) ----- */}
      {drawerOpen && (
        <div
          className="app_scrim"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ----- Main content ----- */}
      <main className="app_main">
        <div className="app_main_inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}