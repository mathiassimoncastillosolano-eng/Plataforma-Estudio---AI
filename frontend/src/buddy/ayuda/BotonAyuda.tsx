import { HelpCircle } from "lucide-react";
import { useBuddy } from "../BuddyProvider";

export default function BotonAyuda() {
  const { abrirAyuda } = useBuddy();
  return (
    <button type="button" className="header-icon-btn" data-tour="ayuda" onClick={abrirAyuda} aria-label="Centro de ayuda" title="Centro de ayuda">
      <HelpCircle size={18} />
    </button>
  );
}
