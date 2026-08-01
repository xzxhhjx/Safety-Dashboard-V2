import { useState, useRef, useEffect } from 'react';
import { uploadExcelStream } from '../api';

export default function ExcelUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const logEndRef = useRef(null);
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (text, type = 'info') => {
    setLogs(prev => [...prev, { text, type, time: new Date().toLocaleTimeString() }]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setLogs([]);
    setProgress(null);
    setResult(null);
    addLog(`Starting upload: ${file.name}`, 'header');

    try {
      for await (const event of uploadExcelStream(file)) {
        switch (event.type) {
          case 'log':
            addLog(event.message, event.phase === 'error' ? 'error' : 'info');
            break;
          case 'progress':
            setProgress({
              current: event.current,
              total: event.total,
              inserted: event.inserted,
              images: event.images,
              errors: event.errors,
            });
            break;
          case 'done':
            setProgress({
              current: event.total,
              total: event.total,
              inserted: event.count,
              images: event.imagesDownloaded,
              errors: event.errors,
            });
            setResult({
              count: event.count,
              total: event.total,
              imagesDownloaded: event.imagesDownloaded,
              errors: event.errors,
            });
            addLog(
              `Complete! ${event.count} records saved, ${event.imagesDownloaded} images downloaded${event.errors ? `, ${event.errors} errors` : ''}`,
              'done'
            );
            break;
          case 'error':
            addLog(`Upload failed: ${event.message}`, 'error');
            break;
        }
      }
    } catch (err) {
      addLog(`Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const pct = progress ? Math.round((progress.current / progress.total) * 100) : 0;
  const LOG_COLORS = {
    header: '#1D1D1F',
    done: '#248A3D',
    error: '#C44235',
    info: '#6E6E73',
  };

  return (
    <div className="card mb-6">
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Upload Excel Data
      </h2>

      <div className="flex gap-4 items-center">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={e => {
            setFile(e.target.files[0]);
            setLogs([]);
            setProgress(null);
            setResult(null);
          }}
          className="text-sm"
          style={{ color: 'var(--text-secondary)' }}
        />
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="btn-primary"
        >
          {loading ? 'Processing...' : 'Upload & Sync'}
        </button>
      </div>

      {progress && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
            <span>
              {progress.inserted !== undefined
                ? `${progress.inserted} inserted`
                : `${progress.current} / ${progress.total}`}
              {progress.images > 0 && ` · ${progress.images} images`}
              {progress.errors > 0 && ` · ${progress.errors} errors`}
            </span>
            <span>{pct}%</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
            <div
              className="h-full transition-all duration-300 rounded-full"
              style={{
                width: `${pct}%`,
                background: result ? 'var(--system-green)' : 'var(--system-blue)',
              }}
            />
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div
          className="mt-3 rounded p-3 max-h-64 overflow-y-auto font-mono text-xs"
          style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-subtle)' }}
        >
          {logs.map((entry, i) => (
            <div
              key={i}
              style={{
                color: LOG_COLORS[entry.type] || '#6E6E73',
                fontWeight: entry.type === 'header' ? 600 : 400,
                borderBottom: entry.type === 'header' ? '1px solid var(--border-subtle)' : 'none',
                paddingBottom: entry.type === 'header' ? 4 : 0,
                marginBottom: entry.type === 'header' ? 4 : 0,
              }}
            >
              <span style={{ color: 'var(--text-tertiary)', marginRight: 8 }}>{entry.time}</span>
              {entry.text}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      )}
    </div>
  );
}
