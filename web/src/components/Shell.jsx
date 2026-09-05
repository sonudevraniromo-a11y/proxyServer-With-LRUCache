import { BarChart3, Compass, LogOut, Menu, Search, X } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import Logo from "./Logo";
export default function Shell() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = [
    ["/home", Compass, "Home"],
    ["/search", Search, "Search website"],
    ["/analytics", BarChart3, "Analytics"],
  ];
  async function signOut() {
    await logout();
    navigate("/login");
  }
  return (
    <div className="app-shell">
      <aside className={open ? "sidebar open" : "sidebar"}>
        <div className="sidebar-top">
          <Logo />
          <button
            className="icon-button mobile-only"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <nav>
          {links.map(([to, Icon, label]) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <div className="user-chip">
            <span>{user?.name?.[0] || "U"}</span>
            <div>
              <b>{user?.name}</b>
              <small>{user?.email}</small>
            </div>
          </div>
          <button className="logout" onClick={signOut}>
            <LogOut size={15} /> Log out
          </button>
        </div>
      </aside>
      <button
        className="menu-trigger mobile-only"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
