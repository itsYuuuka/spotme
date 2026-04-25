import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMenuOpen(false);
  };

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      onClick={() => setMenuOpen(false)}
      className={`block px-4 py-2 rounded transition-colors ${
        location.pathname === to
          ? "text-orange-400 font-bold"
          : "text-gray-300 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/dashboard" className="text-xl font-bold text-orange-400">
          SpotMe
        </Link>

        {isLoggedIn && (
          <>
            {/* Desktop */}
            <div className="hidden md:flex gap-6 items-center">
              {navLink("/dashboard", "Dashboard")}
              {navLink("/templates", "Templates")}
              {navLink("/history", "History")}
              {navLink("/progress", "Progress")}
              {navLink("/friends", "Friends")}
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-400 text-sm cursor-pointer"
              >
                Logout
              </button>
            </div>

            {/* Mobile burger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-gray-300 hover:text-white cursor-pointer text-2xl"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </>
        )}
      </div>

      {/* Mobile menu */}
      {isLoggedIn && menuOpen && (
        <div className="md:hidden mt-4 flex flex-col gap-1">
          {navLink("/dashboard", "Dashboard")}
          {navLink("/templates", "Templates")}
          {navLink("/history", "History")}
          {navLink("/progress", "Progress")}
          {navLink("/friends", "Friends")}
          <button
            onClick={handleLogout}
            className="text-left px-4 py-2 text-gray-400 hover:text-red-400 text-sm cursor-pointer"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
