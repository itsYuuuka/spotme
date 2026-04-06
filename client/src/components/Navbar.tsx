import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { isLoggedIn, logout, name } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={`hover:text-white transition-colors ${location.pathname === to ? "text-orange-400 font-bold" : "text-gray-400"}`}
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
          <div className="flex gap-6 items-center">
            {navLink("/dashboard", "Dashboard")}
            {navLink("/templates", "Templates")}
            {navLink("/history", "History")}
            {navLink("/progress", "Progress")}
            {navLink("/friends", "Friends")}
            <span className="text-gray-500 text-sm">Hey, {name}!</span>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-400 text-sm cursor-pointer"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
