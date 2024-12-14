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

  const getImage = async (imageData: Uint8Array) => {
    const image = await FabricImage.fromURL(
      `data:image/png;base64, ${arrayBufferToBase64(imageData)}`
    );
    const clonedImage = await image.clone();

    return { image, clonedImage };
  };

  useEffect(() => {
    if (!canvas || !imageData) return;

    canvas.setDimensions({ width: 300, height: 300 });
    canvas.selection = false;

    getImage(imageData).then(({ image, clonedImage }) => {
      originalImageRef.current = clonedImage;

      image.scaleToWidth(canvas.width);
      image.scaleToHeight(canvas.height);

      image.selectable = false;
      image.evented = false;
      image.lockMovementX = true;
      image.lockMovementY = true;
      image.lockRotation = true;
      image.lockScalingX = true;
      image.lockScalingY = true;
      image.lockSkewingX = true;
      image.lockSkewingY = true;
      image.hasControls = false;
      image.hasBorders = false;

      image.set({
        left: canvas.width / 2,
        top: canvas.height / 2,
        originX: "center",
        originY: "center",
      });

      canvas.clear();
      canvas.add(image);
      setActiveImage(image);

      // Initialize filters
      if (image) {
        image.filters = Object.values(FilterType).map(
          () => new filters.Brightness({ brightness: 0 })
        );
      }
    });
  }, [canvas, imageData]);

  return { activeImage, originalImageRef };
};
