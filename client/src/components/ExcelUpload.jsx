import { useState, useRef, useEffect } from 'react';
import { uploadExcelStream } from '../api';

export default function ExcelUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(null); // { current, total, inserted, images, errors }
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

  return (
    <div className="card mb-6">
      <h2 className="text-lg font-semibold mb-4">Upload Excel Data</h2>

      {/* File input */}
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
          className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-700 file:text-white hover:file:bg-gray-600"
        />
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Upload & Sync'}
        </button>
      </div>

      {/* Progress bar */}
      {progress && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>
              {progress.inserted !== undefined
                ? `${progress.inserted} inserted`
                : `${progress.current} / ${progress.total}`}
              {progress.images > 0 && ` · ${progress.images} images`}
              {progress.errors > 0 && ` · ${progress.errors} errors`}
            </span>
            <span>{pct}%</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                result ? 'bg-emerald-500' : 'bg-blue-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Log area */}
      {logs.length > 0 && (
        <div className="mt-3 bg-gray-900 border border-gray-700 rounded p-3 max-h-64 overflow-y-auto font-mono text-xs">
          {logs.map((entry, i) => (
            <div key={i} className={`log-line ${
              entry.type === 'header' ? 'text-white font-semibold border-b border-gray-700 pb-1 mb-1' :
              entry.type === 'done' ? 'text-emerald-400' :
              entry.type === 'error' ? 'text-red-400' :
              'text-gray-400'
            }`}>
              <span className="text-gray-600 mr-2">{entry.time}</span>
              {entry.text}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      )}
    </div>
  );
}
