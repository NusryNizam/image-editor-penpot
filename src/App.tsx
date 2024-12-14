import { useState } from "react";
import "./App.css";
import ImageEditor from "./components/ImageEditor";

function App() {
  const url = new URL(window.location.href);
  const initialTheme = url.searchParams.get("theme");
  const [imageData, setImageData] = useState<Uint8Array>();
  const [isSelecting, setIsSelecting] = useState(false);

  const [theme, setTheme] = useState(initialTheme || undefined);

  window.addEventListener("message", (event) => {
    if (event.data.type === "theme") {
      setTheme(event.data.content);
    }

    if (event.data.type === "changing-selection-start") {
      setIsSelecting(true);
    }

    if (event.data.type === "changing-selection-end") {
      setIsSelecting(false);
    }

    if (event.data.type === "selection") {
      setIsSelecting(false);
      setImageData(event.data.data);
    }
  });

  return (
    <div className="app" data-theme={theme}>
      <ImageEditor
        theme={theme}
        imageData={imageData}
        isLoading={isSelecting}
      />
    </div>
  );
}

export default App;
