import { filters } from "fabric";
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
  [FilterType.Pixelate]: { min: 1, max: 5, step: 1, default: 1 },
  [FilterType.Grayscale]: { min: 0, max: 1, step: 1, default: 0 },
  [FilterType.Vintage]: { min: 0, max: 1, step: 1, default: 0 },
  [FilterType.Vibrance]: { min: 0, max: 1.25, step: 0.05, default: 0 },
};

// Custom Hooks

// Main Component
function ImageEditor({ imageData, theme = "light" }: ImageProps) {
  const { canvasRef, canvas } = useCanvas(300, 300);
  const { activeImage, originalImageRef } = useImageLoader(canvas, imageData);

  const [filterValues, setFilterValues] = useState<FilterState>({
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
  });

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

  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      const url = URL.createObjectURL(blob as Blob);
      const link = document.createElement("a");
      link.download = "edited-image.png";
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    });
  }, []);

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
        />
      </div>
    );
  };

  return (
    <div className="container">
      <div className="image-editor">
        <canvas ref={canvasRef} data-theme={theme} />
        <div className="form-container">
          <div className="column column-1">
            {Object.values(FilterType).slice(0, 5).map(renderFilterControl)}
          </div>
          <div className="column column-2">
            {Object.values(FilterType).slice(5).map(renderFilterControl)}
          </div>
        </div>
      </div>
      <button className="download-button" onClick={handleDownload}>
        Download
      </button>
    </div>
  );
}

export default ImageEditor;
