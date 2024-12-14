import { Canvas } from "fabric";
import { useRef, useState, useEffect } from "react";

export const useCanvas = (width: number, height: number) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const fabricCanvas = new Canvas(canvasRef.current, {
        width,
        height,
        backgroundColor: "#828282",
      });
      setCanvas(fabricCanvas);

      return () => {
        fabricCanvas.dispose();
      };
    }
  }, [width, height]);

  return { canvasRef, canvas };
};
