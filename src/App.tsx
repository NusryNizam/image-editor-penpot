import { useState } from "react";
import "./App.css";
import ImageEditor from "./components/ImageEditor";

function App() {
  const url = new URL(window.location.href);
  const initialTheme = url.searchParams.get("theme");
  const [imageData, setImageData] = useState<Uint8Array>();

  const [theme, setTheme] = useState(initialTheme || undefined);

  window.addEventListener("message", (event) => {
    if (event.data.type === "theme") {
      setTheme(event.data.content);
    }

    if (event.data.type === "selection") {
      console.log("inside web app:", event.data.data);
      setImageData(event.data.data);
    }
  });

  return (
    <div data-theme={theme}>
      <ImageEditor theme={theme} imageData={imageData} />
    </div>
  );
}

export default App;
