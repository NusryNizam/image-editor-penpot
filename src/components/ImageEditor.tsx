import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./ImageEditor.css";
import { Canvas, FabricImage, filters } from "fabric";
import { debounce, filter } from "lodash";
import { arrayBufferToBase64 } from "./utils/utils";
type ImageProps = {
  imageData?: Uint8Array;
  theme?: string;
};

enum FilterValues {
  brightness = "brightness",
  contrast = "contrast",
  saturation = "saturation",
  blur = "blur",
  noise = "noise",
  pixelate = "pixelate",
  grayscale = "grayscale",
  vintage = "vintage",
  vibrance = "vibrance",
  resize = "resize",
  blend = "blend",
}

function ImageEditor({ imageData, theme = "light" }: ImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [activeImage, setActiveImage] = useState<FabricImage | null>(null);
  const originalImageRef = useRef<FabricImage | null>(null);

  const [filterVals, setFilterVals] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    blur: 0,
    grayscale: 0,
    vintage: 0,
    noise: 0,
    pixelate: 0,
    vibrance: 0,
    blend: "#ffffff",
  });

  const rafRef = useRef<number | null>(null);
  const pendingValueRef = useRef<number | null>(null);

  const applyFiltersWithRAF = useCallback(
    (value: number, filterValues: FilterValues, extra?: string) => {
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
        switch (filterValues) {
          case FilterValues.brightness:
            activeImage.filters[0] = new filters.Brightness({
              brightness: value,
            });
            break;

          case FilterValues.contrast:
            activeImage.filters[1] = new filters.Contrast({
              contrast: value,
            });
            break;

          case FilterValues.saturation:
            activeImage.filters[2] = new filters.Saturation({
              saturation: value,
            });
            break;

          case FilterValues.blur:
            activeImage.filters[3] = new filters.Blur({
              blur: value,
            });
            break;

          case FilterValues.noise:
            activeImage.filters[4] = new filters.Noise({ noise: value });
            break;

          case FilterValues.pixelate:
            activeImage.filters[5] = new filters.Pixelate({ blocksize: value });
            break;

          case FilterValues.vibrance:
            activeImage.filters[6] = new filters.Vibrance({ vibrance: value });
            break;

          case FilterValues.blend:
            activeImage.filters[7] = new filters.BlendColor({
              color: extra?.toString(),
            });
            break;

          case FilterValues.grayscale:
            if (value) activeImage.filters[10] = new filters.Grayscale();
            else
              activeImage.filters[10] = new filters.Brightness({
                brightness: 0,
              });
            break;

          case FilterValues.vintage:
            if (value) activeImage.filters[11] = new filters.Vintage();
            else
              activeImage.filters[11] = new filters.Brightness({
                brightness: 0,
              });
            break;

          default:
            break;
        }

        // activeImage.filters = [new filters.Brightness({ brightness: value })];
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

    // canvas.width = 600;
    // canvas.height = 400;

    canvas.setDimensions({
      width: 300,
      height: 300,
    });

    if (!imageData) {
      return;
    }

    FabricImage.fromURL(
      `data:image/png;base64, ${arrayBufferToBase64(imageData)}`
    ).then((img) => {
      originalImageRef.current = img;
      const scale =
        Math.min(canvas.width / img.width!, canvas.height / img.height!) * 0.5;

      img.scaleToWidth(canvas.width);
      img.scaleToHeight(canvas.height);

      canvas.clear();
      canvas.add(img);
      setActiveImage(img);
      setTimeout(() => {
        if (activeImage)
          activeImage.filters = [
            new filters.Brightness({
              brightness: 0,
            }),
            new filters.Contrast({
              contrast: 0,
            }),
            new filters.Saturation({
              saturation: 0,
            }),
            new filters.Blur({
              blur: 0,
            }),
          ];
      }, 10);
    });
  }, [canvas, imageData]);

  const handleFilters = useMemo(
    () =>
      debounce(
        (e: React.ChangeEvent<HTMLInputElement>) => {
          if (e.target.name === FilterValues.blend) {
            applyFiltersWithRAF(
              0,
              e.target.name as FilterValues,
              e.target.value
            );
            return;
          }
          console.log("change", e.target);

          const value = Number(e.target.value);
          applyFiltersWithRAF(value, e.target.name as FilterValues);
        },
        80,
        { leading: false, trailing: true }
      ),
    [activeImage, canvas]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const valueStr = e.target.value;

    if (e.target.name === FilterValues.blend) {
      setFilterVals((prev) => ({
        ...prev,
        [e.target.name]: valueStr,
      }));
      return;
    }

    const value = Number(e.target.value);
    setFilterVals((prev) => ({ ...prev, [e.target.name]: value }));
  }, []);

  const handleDownload = () => {
    if (canvasRef.current) {
      canvasRef.current.toBlob(function (blob) {
        const url = URL.createObjectURL(blob as Blob);
        const link = document.createElement("a");
        link.download = "canvas-image.png";
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      });
    }
  };

  return (
    <div className="container">
      <div className="image-editor">
        <canvas ref={canvasRef} data-theme={theme} />
        <div className="form-container">
          <div className="column column-1">
            <div className="form-group">
              <label className="input-label caption" htmlFor="brightness">
                Brightness
              </label>
              <button className="reset">↺</button>
              <input
                type="range"
                className="input range"
                data-theme={theme}
                name={FilterValues.brightness}
                id="brightness"
                min={-0.8}
                step={0.05}
                max={0.8}
                onInput={handleFilters}
                onChange={handleChange}
                value={filterVals.brightness}
              />
            </div>

            <div className="form-group">
              <label className="input-label caption" htmlFor="contrast">
                Contrast
              </label>
              <input
                type="range"
                className="input range"
                data-theme={theme}
                name={FilterValues.contrast}
                id="contrast"
                min={-0.8}
                step={0.05}
                max={0.8}
                onInput={handleFilters}
                onChange={handleChange}
                value={filterVals.contrast}
              />
            </div>

            <div className="form-group">
              <label className="input-label caption" htmlFor="saturation">
                Saturation
              </label>
              <input
                type="range"
                className="input range"
                data-theme={theme}
                name={FilterValues.saturation}
                id="saturation"
                min={-1}
                step={0.05}
                max={1}
                onInput={handleFilters}
                onChange={handleChange}
                value={filterVals.saturation}
              />
            </div>

            <div className="form-group">
              <label className="input-label caption" htmlFor="blur">
                Blur
              </label>
              <input
                type="range"
                className="input range"
                data-theme={theme}
                name={FilterValues.blur}
                id="blur"
                min={0}
                step={0.05}
                max={1}
                onInput={handleFilters}
                onChange={handleChange}
                value={filterVals.blur}
              />
            </div>

            <div className="form-group">
              <label className="input-label caption" htmlFor="grayscale">
                grayscale
              </label>
              <input
                type="range"
                className="input range"
                data-theme={theme}
                name={FilterValues.grayscale}
                id="grayscale"
                min={0}
                step={1}
                max={1}
                onInput={handleFilters}
                onChange={handleChange}
                value={filterVals.grayscale}
              />
            </div>
          </div>
          <div className="column column-2">
            <div className="form-group">
              <label className="input-label caption" htmlFor="vintage">
                vintage
              </label>
              <input
                type="range"
                className="input range"
                data-theme={theme}
                name={FilterValues.vintage}
                id="vintage"
                min={0}
                step={1}
                max={1}
                onInput={handleFilters}
                onChange={handleChange}
                value={filterVals.vintage}
              />
            </div>

            <div className="form-group">
              <label className="input-label caption" htmlFor="noise">
                noise
              </label>
              <input
                type="range"
                className="input range"
                data-theme={theme}
                name={FilterValues.noise}
                id="noise"
                min={0}
                step={1}
                max={200}
                onInput={handleFilters}
                onChange={handleChange}
                value={filterVals.noise}
              />
            </div>

            <div className="form-group">
              <label className="input-label caption" htmlFor="pixelate">
                pixelate
              </label>
              <input
                type="range"
                className="input range"
                data-theme={theme}
                name={FilterValues.pixelate}
                id="pixelate"
                min={1}
                step={1}
                max={5}
                onInput={handleFilters}
                onChange={handleChange}
                value={filterVals.pixelate}
              />
            </div>

            <div className="form-group">
              <label className="input-label caption" htmlFor="vibrance">
                vibrance
              </label>
              <input
                type="range"
                className="input range"
                data-theme={theme}
                name={FilterValues.vibrance}
                id="vibrance"
                min={0}
                step={0.05}
                max={1.25}
                onInput={handleFilters}
                onChange={handleChange}
                value={filterVals.vibrance}
              />
            </div>

            <div className="form-group">
              <label className="input-label caption" htmlFor="blend">
                color blend
              </label>
              <input
                type="color"
                className="input range"
                data-theme={theme}
                name={FilterValues.blend}
                id="blend"
                onInput={handleFilters}
                onChange={handleChange}
                value={filterVals.blend}
              />
            </div>
          </div>
        </div>
      </div>
      <button onClick={handleDownload}>Download</button>
    </div>
  );
}

export default ImageEditor;
