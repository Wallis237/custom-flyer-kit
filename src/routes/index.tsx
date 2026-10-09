import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowLeft, ArrowRight, Check, ImagePlus, LoaderCircle, RotateCcw, ShieldCheck, Sparkles, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FlyerPreview } from '@/components/flyer-preview';
import { CATEGORY_OPTIONS, EVENT_DATE, personalDetailsSchema, validatePhoto } from '@/lib/flyer';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'AI Workflow Lab — Techsquad Flyer Maker' },
    { name: 'description', content: `Create your personalized Techsquad Cameroon AI Workflow Lab attendee flyer for ${EVENT_DATE}. Add your name, category and photo, then download.` },
    { property: 'og:title', content: 'AI Workflow Lab — Your attendee flyer' },
    { property: 'og:description', content: 'Personalize and download your Techsquad Cameroon workshop flyer.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
});

function Index() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<typeof CATEGORY_OPTIONS[number] | ''>('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [original, setOriginal] = useState<File | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState(0);
  const [removing, setRemoving] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestId = useRef(0);

  const onReady = useCallback((canvas: HTMLCanvasElement) => { canvasRef.current = canvas; }, []);
  const onError = useCallback((message: string) => setError(message), []);

  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo); }, [photo]);

  const bgConfig = useCallback((device: 'gpu' | 'cpu') => ({ model: 'isnet_quint8' as const, device, output: { format: 'image/png' as const } }), []);
  const preloaded = useRef<Promise<unknown> | null>(null);

  function preloadTools() {
    if (preloaded.current) return;
    preloaded.current = import('@imgly/background-removal').then((m) => m.preload(bgConfig('cpu'))).catch(() => { preloaded.current = null; });
  }

  async function shrink(file: File, max = 900): Promise<Blob> {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    if (scale === 1) { bitmap.close(); return file; }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(new Error('resize')), 'image/jpeg', 0.92));
  }

  function upload(file?: File) {
    if (!file) return;
    const issue = validatePhoto(file);
    if (issue) { setError(issue); return; }
    requestId.current += 1;
    setError('');
    setOriginal(file);
    setPhoto(URL.createObjectURL(file));
    setZoom(1);
    setPosition(0);
    setRemoved(false);
    setDownloaded(false);
    setRemoving(false);
    preloadTools();
  }

  async function removeBackground() {
    if (!original || removing) return;
    const id = ++requestId.current;
    setRemoving(true);
    setError('');
    setProgress('Preparing photo…');
    try {
      const [{ removeBackground: remove }, small] = await Promise.all([import('@imgly/background-removal'), shrink(original)]);
      const progressFn = (key: string, current: number, total: number) => {
        if (requestId.current === id) setProgress(key.startsWith('fetch') ? `Preparing photo tools… ${Math.round(current / total * 100)}%` : 'Removing background…');
      };
      const hasGpu = typeof navigator !== 'undefined' && 'gpu' in navigator;
      let result: Blob;
      try {
        result = await remove(small, { ...bgConfig(hasGpu ? 'gpu' : 'cpu'), progress: progressFn });
      } catch {
        if (!hasGpu) throw new Error('GPU background removal failed');
        result = await remove(small, { ...bgConfig('cpu'), progress: progressFn });
      }
      if (requestId.current !== id) return;
      setPhoto(URL.createObjectURL(result));
      setRemoved(true);
    } catch {
      if (requestId.current === id) setError('Background removal is unavailable right now. Your original photo is still ready to use; try again when connected to the internet.');
    } finally {
      if (requestId.current === id) {
        setRemoving(false);
        setProgress('');
      }
    }
  }

  function reset() {
    requestId.current += 1;
    setName('');
    setCategory('');
    setPhoto(null);
    setOriginal(null);
    setZoom(1);
    setPosition(0);
    setError('');
    setRemoved(false);
    setRemoving(false);
    setDownloaded(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function download() {
    const parsed = personalDetailsSchema.safeParse({ name, category });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Enter your details.');
      return;
    }
    if (!photo) {
      setError('Add your portrait before downloading.');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      setError('Please wait for your flyer to load.');
      return;
    }

    setError('');
    setExporting(true);
    try {
      const { renderFlyer } = await import('@/lib/render-flyer');
      const output = document.createElement('canvas');
      await renderFlyer(output, { ...parsed.data, photo, zoom, position });
      const blob = await new Promise<Blob>((resolve, reject) => output.toBlob(value => value ? resolve(value) : reject(new Error('Could not save this image.')), 'image/png'));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${parsed.data.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-ai-workflow-lab.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30000);
      setDownloaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  const complete = [Boolean(name.trim()), Boolean(category), Boolean(photo)].filter(Boolean).length;

  return <div className="app-shell">
    <header className="app-header">
      <a href="/" className="brand"><img src="/favicon.png" alt="Techsquad" /><span>TECHSQUAD<span className="brand-country">CAMEROON</span></span></a>
      <div className="header-divider" /><span className="header-label">Flyer studio</span>
      <span className="workshop-chip"><span /> AI WORKFLOW LAB</span>
    </header>
    <main className="studio-main">
      <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> MAKE IT YOURS</div><h1>Your seat. Your flyer.</h1><p>A little personal touch for a big step forward.</p></div></div>
      <div className="studio-layout">
        <section className="editor" aria-label="Personalize your flyer">
          <div className="section-heading"><h2>Personalize your flyer</h2><span className="step-count">{complete} / 3 complete</span></div>
          <div className="section-intro">Made for the next generation of doers.</div>
          <div className="form-section">
            <div className="section-label"><span className="step-number">01</span><h3>Your details</h3></div>
            <label htmlFor="full-name">Full name <span>*</span></label>
            <Input id="full-name" autoComplete="name" placeholder="e.g Tarshi Williams" maxLength={60} value={name} onChange={e => setName(e.target.value)} />
            <label htmlFor="category">Category <span>*</span></label>
            <select id="category" value={category} onChange={e => setCategory(e.target.value as typeof category)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              <option value="">Select your category</option>
              {CATEGORY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>

          <div className="form-section photo-section">
            <div className="section-label"><span className="step-number">02</span><h3>Your portrait</h3></div>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Upload portrait" onChange={e => upload(e.target.files?.[0])} />
            <div className={`upload-zone ${dragging ? 'is-dragging' : ''} ${photo ? 'has-photo' : ''}`} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files?.[0]); }} onClick={() => inputRef.current?.click()}>
              {photo ? <><img className="uploaded-thumbnail" src={photo} alt="Your uploaded portrait" /><div className="uploaded-info"><strong>{original?.name}</strong><span>{removed ? 'Background removed' : 'Ready to use'}</span></div></> : <><ImagePlus /><div><strong>Add your portrait</strong><span>Drag or click to upload</span></div></>}
            </div>
            <Button variant="outline" className="remove-background" onClick={removeBackground} disabled={!photo || removing || removed}>{removing ? <LoaderCircle className="spin" /> : removed ? <Check /> : <Sparkles />}{removing ? 'Removing…' : removed ? 'Removed' : 'Remove background'}</Button>
            {removed && <Button variant="link" className="restore-photo" onClick={() => { if (original) { setPhoto(URL.createObjectURL(original)); setRemoved(false); } }}>Restore original photo</Button>}
            {photo && <div className="photo-adjustments"><label htmlFor="zoom">Photo zoom <span>{Math.round(zoom * 100)}%</span></label><input id="zoom" type="range" min="1" max="2.5" step="0.05" value={zoom} onChange={e => setZoom(Number(e.target.value))} /><label htmlFor="position">Position <span>{Math.round(position * 100)}%</span></label><input id="position" type="range" min="0" max="1" step="0.05" value={position} onChange={e => setPosition(Number(e.target.value))} /></div>}
            <div className="privacy-note"><ShieldCheck />Your photo stays on your device.</div>
          </div>

          <div className="export-section">
            <div className="section-label"><span className="step-number">03</span><h3>Make it official</h3></div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <Button className="download-button" onClick={download} disabled={exporting || removing}>{exporting ? <LoaderCircle className="spin" /> : downloaded ? <Check /> : <ArrowDownToLine />}{exporting ? 'Exporting…' : downloaded ? 'Downloaded' : 'Download your flyer'}</Button>
            {downloaded && <p className="download-success" role="status">Your flyer is ready in your device's downloads.</p>}
            <div className="export-bottom"><span>PNG image · High resolution</span><Button variant="ghost" size="sm" onClick={reset}><RotateCcw />Start over</Button></div>
          </div>
        </section>

        <section className="preview-section" aria-label="Flyer preview">
          <div className="preview-heading"><span><span className="live-dot" /> LIVE PREVIEW</span><span>PORTRAIT · 9:16</span></div>
          <div className="preview-viewport"><FlyerPreview name={name} category={category} photo={photo} zoom={zoom} position={position} onReady={onReady} onError={onError} /></div>
        </section>
      </div>
    </main>
    <footer className="app-footer"><span>LEARN <span>/</span> APPLY <span>/</span> GROW</span><span>Made for the Techsquad community <ArrowLeft /></span></footer>
  </div>;
}
