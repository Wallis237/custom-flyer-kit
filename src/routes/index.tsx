import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowLeft, ArrowRight, Check, ImagePlus, LoaderCircle, RotateCcw, ShieldCheck, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FlyerPreview } from '@/components/flyer-preview';
import { EVENT_DATE, personalDetailsSchema, validatePhoto } from '@/lib/flyer';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'AI Workflow Lab — Techsquad Flyer Maker' },
    { name: 'description', content: 'Create your personalized Techsquad Cameroon AI Workflow Lab attendee flyer for October 23, 2026. Add your name, title and photo, then download.' },
    { property: 'og:title', content: 'AI Workflow Lab — Your attendee flyer' },
    { property: 'og:description', content: 'Personalize and download your Techsquad Cameroon workshop flyer.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
});

function Index() {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState(0);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onReady = useCallback((canvas: HTMLCanvasElement) => { canvasRef.current = canvas; }, []);
  const onError = useCallback((message: string) => setError(message), []);
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo); }, [photo]);
  function upload(file?: File) {
    if (!file) return;
    const issue = validatePhoto(file);
    if (issue) { setError(issue); return; }
    setError('');
    setPhoto(URL.createObjectURL(file));
    setFileName(file.name);
    setZoom(1); setPosition(0); setDownloaded(false);
  }
  function reset() {
    setName(''); setTitle(''); setPhoto(null); setFileName(''); setZoom(1); setPosition(0);
    setError(''); setDownloaded(false);
    if (inputRef.current) inputRef.current.value = '';
  }
  async function download() {
    const parsed = personalDetailsSchema.safeParse({ name, title });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || 'Enter your details.'); return; }
    if (!photo) { setError('Add your portrait before downloading.'); return; }
    const canvas = canvasRef.current;
    if (!canvas) { setError('Please wait for your flyer to load.'); return; }
    setError(''); setExporting(true);
    try {
      const { renderFlyer } = await import('@/lib/render-flyer');
      const output = document.createElement('canvas');
      await renderFlyer(output, { ...parsed.data, photo, zoom, position });
      const blob = await new Promise<Blob>((resolve, reject) => output.toBlob(value => value ? resolve(value) : reject(new Error('Could not save this image.')), 'image/png'));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url;
      link.download = `${parsed.data.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-ai-workflow-lab.png`;
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30000); setDownloaded(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Download failed. Please try again.'); }
    finally { setExporting(false); }
  }
  const complete = [Boolean(name.trim()), Boolean(title.trim()), Boolean(photo)].filter(Boolean).length;
  return <div className="app-shell">
    <header className="app-header">
      <a href="/" className="brand"><img src="/favicon.png" alt="Techsquad" /><span>TECHSQUAD<span className="brand-country">CAMEROON</span></span></a>
      <div className="header-divider" /><span className="header-label">Flyer studio</span>
      <span className="workshop-chip"><span /> AI WORKFLOW LAB</span>
    </header>
    <main className="studio-main">
      <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> MAKE IT YOURS</div><h1>Your seat. Your flyer.</h1><p>A little personal touch for a big step forward.</p></div><div className="event-summary"><span className="event-dot" /><div><strong>{EVENT_DATE}</strong><span>7:00pm – 9:00pm · Online</span></div></div></div>
      <div className="studio-layout">
        <section className="editor" aria-label="Personalize your flyer">
          <div className="section-heading"><h2>Personalize your flyer</h2><span className="step-count">{complete} / 3 complete</span></div>
          <div className="section-intro">Made for the next generation of doers.</div>
          <div className="form-section"><div className="section-label"><span className="step-number">01</span><h3>Your details</h3></div>
            <label htmlFor="full-name">Full name <span>*</span></label><Input id="full-name" autoComplete="name" placeholder="e.g. Tarshi Williams" maxLength={60} value={name} onChange={e => { setName(e.target.value); setDownloaded(false); }} className="details-input" />
            <label htmlFor="job-title">Title / profession <span>*</span></label><Input id="job-title" autoComplete="organization-title" placeholder="e.g. Software Engineer" maxLength={60} value={title} onChange={e => { setTitle(e.target.value); setDownloaded(false); }} className="details-input" />
          </div>
          <div className="form-section photo-section"><div className="section-label"><span className="step-number">02</span><h3>Your portrait</h3></div>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Upload portrait" onChange={e => upload(e.target.files?.[0])} />
            <div className={`upload-zone ${dragging ? 'is-dragging' : ''} ${photo ? 'has-photo' : ''}`} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files[0]); }}>
              {photo ? <><img className="uploaded-thumbnail" src={photo} alt="Your uploaded portrait" /><div className="uploaded-info"><strong>{fileName}</strong><span>Photo added</span><Button variant="link" onClick={() => inputRef.current?.click()} className="change-photo"><Upload />Change photo</Button></div><Button variant="ghost" size="icon" aria-label="Remove photo" title="Remove photo" onClick={() => { setPhoto(null); setFileName(''); if (inputRef.current) inputRef.current.value = ''; }}><X /></Button></> : <><div className="upload-icon"><ImagePlus /></div><Button variant="link" onClick={() => inputRef.current?.click()} className="upload-prompt">Choose a photo <span>or drag it here</span></Button><span className="file-note">JPG, PNG or WebP · Up to 10 MB</span></>}
            </div>
            {photo && <div className="photo-adjustments"><label htmlFor="zoom">Photo zoom <span>{Math.round(zoom * 100)}%</span></label><input id="zoom" type="range" min="1" max="2.5" step="0.05" value={zoom} onChange={e => setZoom(Number(e.target.value))} /><label htmlFor="position">Vertical position</label><input id="position" type="range" min="-150" max="150" step="1" value={position} onChange={e => setPosition(Number(e.target.value))} /></div>}
            <div className="privacy-note"><ShieldCheck />Your photo stays on your device.</div>
          </div>
          <div className="export-section"><div className="section-label"><span className="step-number">03</span><h3>Make it official</h3></div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <Button className="download-button" onClick={download} disabled={exporting}>{exporting ? <LoaderCircle className="spin" /> : downloaded ? <Check /> : <ArrowDownToLine />}{exporting ? 'Saving your flyer…' : downloaded ? 'Download again' : 'Download my flyer'}<ArrowRight /></Button>
            {downloaded && <p className="download-success" role="status">Your flyer is ready in your device’s downloads.</p>}
            <div className="export-bottom"><span>PNG image · High resolution</span><Button variant="ghost" size="sm" onClick={reset}><RotateCcw />Start over</Button></div>
          </div>
        </section>
        <section className="preview-section" aria-label="Flyer preview"><div className="preview-heading"><span><span className="live-dot" /> LIVE PREVIEW</span><span>PORTRAIT · 9:16</span></div><div className="preview-stage"><div className="flyer-wrap"><FlyerPreview name={name} title={title} photo={photo} zoom={zoom} position={position} onReady={onReady} onError={onError} /></div></div><div className="preview-footer"><span><Check />Official workshop template</span><span>23 OCT 2026</span></div></section>
      </div>
    </main>
    <footer className="app-footer"><span>LEARN <span>/</span> APPLY <span>/</span> GROW</span><span>Made for the Techsquad community <ArrowLeft /></span></footer>
  </div>;
}
