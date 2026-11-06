import { createRoot } from "react-dom/client";
import { BonusView } from "@/components/bonus-view";
import "./styles.css";

const root = document.getElementById("app");
if (!root) throw new Error("The game screen is unavailable. Reload to try again.");
createRoot(root).render(<BonusView />);
