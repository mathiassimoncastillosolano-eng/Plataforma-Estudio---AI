import { Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "../hooks/useTheme";

const options: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Claro", icon: Sun },
  { id: "dark", label: "Oscuro", icon: Moon },
];

/** Selector de modo (claro / oscuro) como control segmentado. */
export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="seg" role="radiogroup" aria-label="Modo de apariencia">
      {options.map(({ id, label, icon: Icon }) => (
        <button key={id} type="button" role="radio" aria-checked={theme === id} className={`seg-btn ${theme === id ? "active" : ""}`} onClick={() => setTheme(id)}>
          <Icon size={15} />
          {label}
        </button>
      ))}
    </div>
  );
}
