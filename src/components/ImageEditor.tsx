import { Canvas, filters } from "fabric";
import { debounce } from "lodash";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useImageLoader } from "../hooks/useImageLoader";
import { useCanvas } from "../hooks/useCanvas";
import "./ImageEditor.css";

// Types and Interfaces
interface ImageProps {
  imageData?: Uint8Array;
  theme?: string;
}

interface FilterState {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  grayscale: number;
  vintage: number;
  noise: number;
  pixelate: number;
  vibrance: number;
  blend: string;
}

export enum FilterType {
  Brightness = "brightness",
  Contrast = "contrast",
  Saturation = "saturation",
  Blur = "blur",
  Noise = "noise",
  Pixelate = "pixelate",
  Grayscale = "grayscale",
  Vintage = "vintage",
  Vibrance = "vibrance",
  Blend = "blend",
}

// Filter Configuration
const FILTER_CONFIG: Record<
  string,
  { min: number; max: number; default: number; step: number }
> = {
  [FilterType.Brightness]: { min: -0.8, max: 0.8, step: 0.05, default: 0 },
  [FilterType.Contrast]: { min: -0.8, max: 0.8, step: 0.05, default: 0 },
  [FilterType.Saturation]: { min: -1, max: 1, step: 0.05, default: 0 },
  [FilterType.Blur]: { min: 0, max: 1, step: 0.05, default: 0 },
  [FilterType.Noise]: { min: 0, max: 200, step: 1, default: 0 },
  [FilterType.Pixelate]: { min: 1, max: 50, step: 1, default: 1 },
  [FilterType.Grayscale]: { min: 0, max: 1, step: 1, default: 0 },
  [FilterType.Vintage]: { min: 0, max: 1, step: 1, default: 0 },
  [FilterType.Vibrance]: { min: 0, max: 1.25, step: 0.05, default: 0 },
};

const initialState = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
  grayscale: 0,
  vintage: 0,
  noise: 0,
  pixelate: 1,
  vibrance: 0,
  blend: "#ffffff",
};

// Main Component
function ImageEditor({ imageData, theme = "light" }: ImageProps) {
  const { canvasRef, canvas } = useCanvas(300, 300);
  const { activeImage, originalImageRef } = useImageLoader(canvas, imageData);

  const [filterValues, setFilterValues] = useState<FilterState>(initialState);

  const rafRef = useRef<number | null>(null);
  const pendingValueRef = useRef<number | null>(null);

  // Filter Application Logic
  const applyFilter = useCallback(
    (value: number, filterType: FilterType, extra?: string) => {
      if (!activeImage || !canvas) return;

      const filterMap = {
        [FilterType.Brightness]: () =>
          new filters.Brightness({ brightness: value }),
        [FilterType.Contrast]: () => new filters.Contrast({ contrast: value }),
        [FilterType.Saturation]: () =>
          new filters.Saturation({ saturation: value }),
        [FilterType.Blur]: () => new filters.Blur({ blur: value }),
        [FilterType.Noise]: () => new filters.Noise({ noise: value }),
        [FilterType.Pixelate]: () => new filters.Pixelate({ blocksize: value }),
        [FilterType.Vibrance]: () => new filters.Vibrance({ vibrance: value }),
        [FilterType.Blend]: () => new filters.BlendColor({ color: extra }),
        [FilterType.Grayscale]: () =>
          value
            ? new filters.Grayscale()
            : new filters.Brightness({ brightness: 0 }),
        [FilterType.Vintage]: () =>
          value
            ? new filters.Vintage()
            : new filters.Brightness({ brightness: 0 }),
      };

      const filterIndex = Object.values(FilterType).indexOf(filterType);
      activeImage.filters[filterIndex] = filterMap[filterType]();
      activeImage.applyFilters();
      canvas.renderAll();
    },
    [activeImage, canvas]
  );

  // Event Handlers
  const handleFilterChange = useMemo(
    () =>
      debounce((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const filterType = name as FilterType;

        pendingValueRef.current = Number(value);

        if (rafRef.current) return;

        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          const latestValue = pendingValueRef.current;

          if (latestValue === null) return;

          pendingValueRef.current = null;
          applyFilter(
            latestValue,
            filterType,
            filterType === FilterType.Blend ? value : undefined
          );
        });
      }, 80),
    [applyFilter]
  );

  const handleAddToCanvas = useCallback(async () => {
    if (!originalImageRef.current || !activeImage) return;

    try {
      const originalImage = originalImageRef.current;

      // Create temporary canvas at original image size
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = originalImage.width!;
      tempCanvas.height = originalImage.height!;

      // Create a new Fabric.js canvas for the download
      const downloadCanvas = new Canvas(tempCanvas);

      // Clone the original image for download
      const downloadImage = await originalImage.clone();

      // Center image on the temporary canvas
      // downloadImage.center();

      // Add the image to the download canvas
      downloadCanvas.add(downloadImage);

      // Apply current filters
      downloadImage.filters = [...activeImage.filters];
      downloadImage.applyFilters();

      // Render and download
      downloadCanvas.renderAll();

      tempCanvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error("Failed to create blob from canvas");
        }

        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        parent.postMessage(
          {
            type: "edited-image",
            data: {
              image: uint8Array,
              width: downloadCanvas.width,
              height: downloadCanvas.height,
            },
          },
          "*"
        );
        // Clean up
        downloadCanvas.dispose();

        console.log("EDITED: ", uint8Array);

        return uint8Array;
      });
    } catch (error) {
      console.error("Error during download:", error);
    }
  }, [originalImageRef, activeImage]);

  const resetAll = () => {
    setFilterValues(initialState);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Render Filter Controls
  const renderFilterControl = (filterType: FilterType) => {
    const config = FILTER_CONFIG[filterType];
    const isColorPicker = filterType === FilterType.Blend;

    return (
      <div className="form-group" key={filterType}>
        <label className="input-label caption" htmlFor={filterType}>
          {filterType}
        </label>
        <input
          type={isColorPicker ? "color" : "range"}
          className="input range"
          data-theme={theme}
          name={filterType}
          id={filterType}
          min={config?.min}
          max={config?.max}
          step={config?.step}
          value={filterValues[filterType]}
          onChange={(e) => {
            setFilterValues((prev) => ({
              ...prev,
              [filterType]: isColorPicker
                ? e.target.value
                : Number(e.target.value),
            }));
            handleFilterChange(e);
          }}
          disabled={!activeImage}
        />
      </div>
    );
  };

  return (
    <div className="container">
      <div className="image-editor">
        <canvas
          ref={canvasRef}
          data-theme={theme}
          style={{
            border: `1px solid ${theme === "dark" ? "#2e3434" : "#eef0f2"}`,
          }}
        />
        {!activeImage ? (
          <div className="caption message">Select an image to edit</div>
        ) : null}
        <div>
          <div className="form-container">
            <div className="column column-1">
              {Object.values(FilterType).slice(0, 5).map(renderFilterControl)}
            </div>
            <div className="column column-2">
              {Object.values(FilterType).slice(5).map(renderFilterControl)}
            </div>
          </div>
          <div className="button-container">
            <button
              className="download-button"
              data-appearance="secondary"
              onClick={resetAll}
              disabled={!activeImage}
            >
              Reset All
            </button>
            <button
              className="download-button"
              data-appearance="primary"
              onClick={handleAddToCanvas}
              disabled={!activeImage}
            >
              Add to Canvas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageEditor;
