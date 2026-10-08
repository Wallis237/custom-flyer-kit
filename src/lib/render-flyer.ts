import template from '@/assets/flyer-template.jpg';
import { FLYER_WIDTH, FLYER_HEIGHT } from './flyer';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The image could not be opened. Please choose another photo.'));
    image.src = src;
  });
}

export async function renderFlyer(canvas: HTMLCanvasElement, details: { name: string; title: string; photo: string | null; zoom: number; position: number }) {
  const [background, photo] = await Promise.all([loadImage(template), details.photo ? loadImage(details.photo) : Promise.resolve(null)]);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image preview is unavailable on this device.');
  canvas.width = FLYER_WIDTH;
  canvas.height = FLYER_HEIGHT;
  ctx.scale(2, 2);
  ctx.drawImage(background, 0, 0, 768, 1376);
  const tokens = getComputedStyle(document.documentElement);
  const ink = tokens.getPropertyValue('--flyer-ink').trim();
  const paper = tokens.getPropertyValue('--flyer-paper').trim();
  ctx.save();
  ctx.beginPath();
  ctx.arc(385, 763, 180, 0, Math.PI * 2);
  ctx.clip();
  if (photo) {
    const scale = Math.max(360 / photo.width, 360 / photo.height) * details.zoom;
    const width = photo.width * scale;
    const height = photo.height * scale;
    ctx.drawImage(photo, 385 - width / 2, 763 - height / 2 + details.position, width, height);
  } else {
    ctx.fillStyle = paper;
    ctx.globalAlpha = 0.22;
    ctx.beginPath(); ctx.arc(385, 722, 49, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(385, 875, 105, 103, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fitText = (text: string, x: number, y: number, width: number, size: number, weight: number) => {
    let fontSize = size;
    ctx.font = `${weight} ${fontSize}px Arial, sans-serif`;
    while (ctx.measureText(text).width > width && fontSize > 10) {
      fontSize -= 0.5;
      ctx.font = `${weight} ${fontSize}px Arial, sans-serif`;
    }
    ctx.fillText(text, x, y);
  };
  ctx.fillStyle = paper;
  fitText((details.name.trim() || 'YOUR NAME').toUpperCase(), 433, 979, 358, 25, 700);
  ctx.fillStyle = ink;
  fitText((details.title.trim() || 'YOUR TITLE').toUpperCase(), 387, 1028, 272, 15, 600);
}