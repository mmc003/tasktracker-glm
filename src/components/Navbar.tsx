import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

export function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <span className="logo-icon">T</span>
        <span className="logo-text">TaskFlow</span>
      </div>
      <div className="navbar-right">
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <div className="navbar-links">
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Dashboard
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Tasks
          </NavLink>
          <NavLink to="/calendar" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Calendar
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
