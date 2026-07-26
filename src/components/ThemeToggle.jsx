import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../lib/theme.jsx';
import './ThemeToggle.css';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`theme-toggle icon-btn ${className}`}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="theme-toggle__icon" data-visible={isDark}>
        <Moon size={18} strokeWidth={2} />
      </span>
      <span className="theme-toggle__icon" data-visible={!isDark}>
        <Sun size={18} strokeWidth={2} />
      </span>
    </button>
  );
}