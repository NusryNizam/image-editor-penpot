import {
  act,
  EventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./ImageEditor.css";
import { Canvas, FabricImage, filters } from "fabric";
import { debounce } from "lodash";
type ImageProps = {
  imageData?: string | Uint8Array;
  theme?: string;
};

type FilterValues = {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
};

function ImageEditor({
  imageData = "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",
  theme = "light",
}: ImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const htmlEl = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [activeImage, setActiveImage] = useState<FabricImage | null>(null);
  const [brightness, setBrightness] = useState(0);

  const rafRef = useRef<number | null>(null);
  const pendingValueRef = useRef<number | null>(null);

  const applyFiltersWithRAF = useCallback(
    (value: number) => {
      // Store the latest value
      pendingValueRef.current = value;

      // If we already have a frame queued, don't queue another
      if (rafRef.current) return;

      // Queue the update
      rafRef.current = requestAnimationFrame(() => {
        // Clear the frame reference
        rafRef.current = null;

        // Get the latest value
        const latestValue = pendingValueRef.current;
        if (latestValue === null || !activeImage || !canvas) return;

        // Clear the pending value
        pendingValueRef.current = null;

        // Apply the filter
        activeImage.filters = [new filters.Brightness({ brightness: value })];
        activeImage.applyFilters();
        canvas.renderAll();
      });
    },
    [pendingValueRef.current, canvas, activeImage]
  );

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      const fabricCanvas = new Canvas(canvasRef.current, {
        width: 600,
        height: 400,
        backgroundColor: "#828282",
      });
      setCanvas(fabricCanvas);

      return () => {
        fabricCanvas.dispose();
      };
    }
  }, []);

  useEffect(() => {
    if (!canvas) return;

    FabricImage.fromURL(
      "data:image/png;base64,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"
    )
      // FabricImage.fromURL(
      //   "https://images.unsplash.com/photo-1733387180500-1312b64f4a45?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwyN3x8fGVufDB8fHx8fA%3D%3D",
      //   { crossOrigin: "anonymous" }
      // )
      .then((img) => {
        const scale =
          Math.min(
            (canvas.width ?? 600) / img.width!,
            (canvas.height ?? 400) / img.height!
          ) * 0.8;

        img.scale(scale);
        img.set({
          left: (canvas.width ?? 600) / 2,
          top: (canvas.height ?? 400) / 2,
          originX: "center",
          originY: "center",
        });

        canvas.clear();
        canvas.add(img);
        setActiveImage(img);
      });
  }, [canvas, imageData]);

  const handleBrightness = useMemo(
    () =>
      debounce(
        (e: React.ChangeEvent<HTMLInputElement>) => {
          const value = Number(e.target.value);
          applyFiltersWithRAF(value);
        },
        80,
        { leading: false, trailing: true }
      ),
    [activeImage, canvas]
  );

  return (
    <div>
      <div ref={htmlEl}>ImageEditor</div>
      <canvas ref={canvasRef} />

      <div className="form-group">
        <label className="input-label caption" htmlFor="brightness">
          Brightness
        </label>

        <input
          type="range"
          className="input range"
          data-theme={theme}
          name="brightness"
          id="brightness"
          min={-0.8}
          step={0.05}
          max={0.8}
          onInput={handleBrightness}
        />
      </div>
    </div>
  );
}

export default ImageEditor;
