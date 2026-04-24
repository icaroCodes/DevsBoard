import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const ThemeContext = createContext();

export const THEMES = {
  obsidian: {
    label: 'Obsidian',
    preview: ['#0A0A0B', '#1C1C1E', '#0A84FF'],
    vars: {
      '--db-bg': '#0A0A0B',
      '--db-surface': '#161618',
      '--db-surface-2': '#1C1C1E',
      '--db-surface-3': '#2C2C2E',
      '--db-text': '#F5F5F7',
      '--db-text-2': '#86868B',
      '--db-text-3': '#636366',
      '--db-accent': '#0A84FF',
      '--db-accent-hover': '#007AFF',
      '--db-accent-muted': 'rgba(10, 132, 255, 0.1)',
      '--db-border': 'rgba(255, 255, 255, 0.06)',
      '--db-border-2': 'rgba(255, 255, 255, 0.1)',
      '--db-blue': '#0A84FF',
      '--db-red': '#FF453A',
      '--db-sidebar': '#161717'
    }
  },
  midnight: {
    label: 'Midnight Luxe',
    preview: ['#0D0D12', '#1A1A24', '#C9A84C'],
    vars: {
      '--db-bg': '#0D0D12',
      '--db-surface': '#15151D',
      '--db-surface-2': '#1A1A24',
      '--db-surface-3': '#252535',
      '--db-text': '#FAF8F5',
      '--db-text-2': '#A1A1B5',
      '--db-text-3': '#71718A',
      '--db-accent': '#C9A84C',
      '--db-accent-hover': '#B08E35',
      '--db-accent-muted': 'rgba(201, 168, 76, 0.1)',
      '--db-border': 'rgba(201, 168, 76, 0.1)',
      '--db-border-2': 'rgba(201, 168, 76, 0.2)',
      '--db-blue': '#C9A84C',
      '--db-red': '#E63B2E',
      '--db-sidebar': '#0D0D12'
    }
  },
  arctic: {
    label: 'Arctic Light',
    preview: ['#F5F7F9', '#FFFFFF', '#007AFF'],
    vars: {
      '--db-bg': '#F5F7F9',
      '--db-surface': '#FFFFFF',
      '--db-surface-2': '#EDF1F5',
      '--db-surface-3': '#E1E7EE',
      '--db-text': '#1D1D1F',
      '--db-text-2': '#86868B',
      '--db-text-3': '#A1A1A6',
      '--db-accent': '#007AFF',
      '--db-accent-hover': '#0062CC',
      '--db-accent-muted': 'rgba(0, 122, 255, 0.1)',
      '--db-border': 'rgba(0, 0, 0, 0.05)',
      '--db-border-2': 'rgba(0, 0, 0, 0.1)',
      '--db-blue': '#007AFF',
      '--db-red': '#FF3B30',
      '--db-sidebar': '#F5F7F9'
    }
  },
  forest: {
    label: 'Deep Forest',
    preview: ['#0B120F', '#16241E', '#30D158'],
    vars: {
      '--db-bg': '#0B120F',
      '--db-surface': '#111D18',
      '--db-surface-2': '#16241E',
      '--db-surface-3': '#21352D',
      '--db-text': '#F2F0E9',
      '--db-text-2': '#7E8C85',
      '--db-text-3': '#56635D',
      '--db-accent': '#30D158',
      '--db-accent-hover': '#28B84B',
      '--db-accent-muted': 'rgba(48, 209, 88, 0.1)',
      '--db-border': 'rgba(48, 209, 88, 0.08)',
      '--db-border-2': 'rgba(48, 209, 88, 0.15)',
      '--db-blue': '#30D158',
      '--db-red': '#FF453A',
      '--db-sidebar': '#0B120F'
    }
  },
  liquidglass: {
    label: 'Liquid Glass',
    preview: ['#050507', '#141418', '#0A84FF'],
    isGlass: true,
    vars: {
      '--db-bg': '#050507',
      '--db-surface': 'rgba(255, 255, 255, 0.05)',
      '--db-surface-2': 'rgba(255, 255, 255, 0.07)',
      '--db-surface-3': 'rgba(255, 255, 255, 0.10)',
      '--db-bg-secondary': 'rgba(255, 255, 255, 0.03)',
      '--db-text': '#F5F5F7',
      '--db-text-2': '#98989D',
      '--db-text-3': '#636366',
      '--db-accent': '#0A84FF',
      '--db-accent-hover': '#0071E3',
      '--db-accent-muted': 'rgba(10, 132, 255, 0.12)',
      '--db-border': 'rgba(255, 255, 255, 0.10)',
      '--db-border-2': 'rgba(255, 255, 255, 0.14)',
      '--db-blue': '#0A84FF',
      '--db-red': '#FF453A',
      '--db-sidebar': '#050507'
    }
  }
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('db_theme') || 'obsidian';
  });

  const applyTheme = (themeName) => {
    const config = THEMES[themeName] || THEMES.obsidian;
    const root = document.documentElement;
    
    Object.entries(config.vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    document.body.setAttribute('data-theme', themeName);
    
    document.body.style.backgroundColor = config.vars['--db-bg'];
    document.body.style.color = config.vars['--db-text'];
  };

  useEffect(() => {
    applyTheme(theme);
    
    
    const handleThemeChange = (e) => {
      const newTheme = e.detail;
      if (newTheme && THEMES[newTheme]) {
        setThemeState(newTheme);
        localStorage.setItem('db_theme', newTheme);
        applyTheme(newTheme);
      }
    };

    window.addEventListener('themechange', handleThemeChange);
    return () => window.removeEventListener('themechange', handleThemeChange);
  }, [theme]);

  const setTheme = async (newTheme) => {
    if (!THEMES[newTheme]) return;
    
    
    setThemeState(newTheme);
    localStorage.setItem('db_theme', newTheme);
    applyTheme(newTheme);

    
    try {
      await api('/settings', {
        method: 'PUT',
        body: JSON.stringify({ theme: newTheme })
      });
    } catch (err) {
      console.error('Failed to save theme preference:', err);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
