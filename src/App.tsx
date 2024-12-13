import { useState } from "react";
import "./App.css";
import ImageEditor from "./components/ImageEditor";

function App() {
  const url = new URL(window.location.href);
  const initialTheme = url.searchParams.get("theme");

  const [theme, setTheme] = useState(initialTheme || undefined);

  window.addEventListener("message", (event) => {
    if (event.data.type === "theme") {
      setTheme(event.data.content);
    }
  });

  return (
    <div data-theme={theme}>
      <ImageEditor theme={theme} />
    </div>
  );
}

export default App;
