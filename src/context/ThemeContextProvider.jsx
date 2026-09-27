import { useState, useEffect } from "react";
import ThemeContext from "./themeContext";

export function ThemeProvider({ children }) {
  // Default to 'dark' (Obsidian Dark) as primary theme, or restore user's saved preference
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("intravote_theme");
    return savedTheme ? savedTheme : "dark";
  });

  // UX4G Font Size scaling: 'small' (14px), 'default' (16px), 'large' (18px)
  const [fontSize, setFontSize] = useState(() => {
    const savedSize = localStorage.getItem("intravote_font_size");
    return savedSize ? savedSize : "default";
  });

  useEffect(() => {
    // Apply data-theme attribute on documentElement and class on body
    document.documentElement.setAttribute("data-theme", theme);
    document.body.className = `theme-${theme}`;
    localStorage.setItem("intravote_theme", theme);
  }, [theme]);

  useEffect(() => {
    // Apply data-font-size attribute on documentElement
    document.documentElement.setAttribute("data-font-size", fontSize);
    localStorage.setItem("intravote_font_size", fontSize);
  }, [fontSize]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  };

  const applyFontSize = (size) => {
    if (["small", "default", "large"].includes(size)) {
      setFontSize(size);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, fontSize, applyFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
