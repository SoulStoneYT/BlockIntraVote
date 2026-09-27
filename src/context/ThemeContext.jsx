import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Default to 'dark' as primary theme, or restore user's saved preference
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("intravote_theme");
    return savedTheme ? savedTheme : "dark";
  });

  useEffect(() => {
    // Apply data-theme attribute on documentElement and class on body
    document.documentElement.setAttribute("data-theme", theme);
    document.body.className = `theme-${theme}`;
    localStorage.setItem("intravote_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export default ThemeContext;
