
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    // For server-side rendering
    if (typeof window === "undefined") return "light";
    
    // Use OS preference as default if no localStorage value exists
    const defaultTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
      
    const storedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    return storedTheme || defaultTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    localStorage.setItem("theme", theme);
    console.log("Theme set to:", theme); // Debug log
  }, [theme]);

  const toggleTheme = () => {
    console.log("Toggle theme clicked"); // Debug log
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="transition-all duration-300"
    >
      {theme === "light" ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
    </Button>
  );
};

export default ThemeToggle;
