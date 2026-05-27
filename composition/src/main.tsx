import { createRoot } from "react-dom/client";
import { R3FPreview } from "./R3FPreview";

const mount = document.getElementById("r3f-root");

if (!mount) {
  throw new Error("Missing #r3f-root element");
}

const markSceneReady = () => {
  window.__motionablR3FReady = true;
  window.dispatchEvent(new Event("motionabl:r3f-ready"));
};

createRoot(mount).render(<R3FPreview onSceneReady={markSceneReady} />);
