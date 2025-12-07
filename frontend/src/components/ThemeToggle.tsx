"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("sunset");

  useEffect(() => {
    
    const stored = localStorage.getItem("theme") || "sunset";
    setTheme(stored);
    document.body.setAttribute("data-theme", stored);
  }, []);

  const toggleTheme = () => {
    const next = theme === "sunset" ? "retro" : "sunset";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.body.setAttribute("data-theme", next);
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-4 right-4 btn btn-circle btn-ghost border border-base-content/20 z-50"
    >
      {theme === "sunset" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
