import { Canvas, FabricImage, filters } from "fabric";
import { useState, useRef, useEffect } from "react";
import { arrayBufferToBase64 } from "../components/utils/utils";
import { FilterType } from "../components/ImageEditor";

export const useImageLoader = (
  canvas: Canvas | null,
  imageData?: Uint8Array
) => {
  const [activeImage, setActiveImage] = useState<FabricImage | null>(null);
  const originalImageRef = useRef<FabricImage | null>(null);

  useEffect(() => {
    if (!canvas || !imageData) return;

    canvas.setDimensions({ width: 300, height: 300 });

    FabricImage.fromURL(
      `data:image/png;base64, ${arrayBufferToBase64(imageData)}`
    ).then((img) => {
      originalImageRef.current = img;

      img.scaleToWidth(canvas.width);
      img.scaleToHeight(canvas.height);

      canvas.clear();
      canvas.add(img);
      setActiveImage(img);

      // Initialize filters
      if (img) {
        img.filters = Object.values(FilterType).map(
          () => new filters.Brightness({ brightness: 0 })
        );
      }
    });
  }, [canvas, imageData]);

  return { activeImage, originalImageRef };
};
