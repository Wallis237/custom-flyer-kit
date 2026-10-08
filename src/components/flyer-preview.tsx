import { useEffect, useRef } from 'react';
import { renderFlyer } from '@/lib/render-flyer';

export function FlyerPreview({ name, title, photo, zoom, position, onReady, onError }: {
  name: string; title: string; photo: string | null; zoom: number; position: number;
  onReady: (canvas: HTMLCanvasElement) => void; onError: (message: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const generation = useRef(0);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const version = ++generation.current;
    const buffer = document.createElement('canvas');
    renderFlyer(buffer, { name, title, photo, zoom, position }).then(() => {
      if (generation.current !== version) return;
      canvas.width = buffer.width; canvas.height = buffer.height;
      canvas.getContext('2d')?.drawImage(buffer, 0, 0);
      onReady(canvas);
    }).catch((error: unknown) => {
      if (generation.current === version) onError(error instanceof Error ? error.message : 'The preview could not load.');
    });
  }, [name, title, photo, zoom, position, onReady, onError]);
  return <canvas ref={canvasRef} width={1536} height={2752} className="flyer-canvas" aria-label={`Personalized AI Workflow Lab flyer for ${name || 'your name'}, ${title || 'your title'}, October 23, 2026`} />;
}