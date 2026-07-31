import { useState, useRef, useEffect } from 'react';
import { classifyBatchStream, aiPause, aiResume, aiCancel } from '../api';

export default function AIClassifyPanel() {
  const [scope, setScope] = useState('unanalyzed');
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [logs, setLogs] = useState([]);
  const [currentItem, setCurrentItem] = useState(null); // record being classified
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, currentItem]);

  const addLog = (text, type = 'info') => {
    setLogs(prev => [...prev, { text, type, time: new Date().toLocaleTimeString() }]);
  };

  const handleStart = async () => {
    setRunning(true);
    setPaused(false);
    setLogs([]);
    setCurrentItem(null);
    setProgress(null);
    setResult(null);

    try {
      for await (const event of classifyBatchStream({ scope })) {
        switch (event.type) {
          case 'start':
            setProgress({ current: 0, total: event.total, done: 0, errors: 0 });
            addLog(event.message, 'info');
            break;

          case 'classifying':
            setCurrentItem({
              index: event.index,
              total: event.total,
              docId: event.docId,
              description: event.description,
              hazard: event.hazard,
              submitter: event.submitter,
              area: event.area,
              hasImages: event.hasImages,
            });
            break;

          case 'result':
            setCurrentItem(null);
            addLog(
              `${event.index}/${event.total}  ${event.docId}  →  ${event.category}  [${event.confidence}]  (${event.method})`,
              'result'
            );
            break;

          case 'log':
            addLog(event.message, event.phase === 'error' ? 'error' : 'info');
            break;

          case 'progress':
            setProgress({
              current: event.current,
              total: event.total,
              done: event.done,
              errors: event.errors,
            });
            break;

          case 'paused':
            setPaused(true);
            setCurrentItem(null);
            addLog(`⏸ Paused at ${event.done}/${event.total}`, 'pause');
            break;

          case 'cancelled':
            setCurrentItem(null);
            setResult({ cancelled: true, done: event.done, total: event.total });
            addLog(event.message, 'warn');
            setRunning(false);
            setPaused(false);
            break;

          case 'done':
            setCurrentItem(null);
            setProgress({
              current: event.total,
              total: event.total,
              done: event.done,
              errors: event.errors,
            });
            setResult({ done: event.done, total: event.total, skipped: event.skipped, errors: event.errors });
            addLog(`Complete! ${event.done} classified, ${event.skipped} skipped, ${event.errors} errors`, 'done');
            setRunning(false);
            setPaused(false);
            break;

          case 'error':
            addLog(`Fatal error: ${event.message}`, 'error');
            setRunning(false);
            setPaused(false);
            break;
        }
      }
    } catch (err) {
      addLog(`Connection error: ${err.message}`, 'error');
    } finally {
      setRunning(false);
      setPaused(false);
    }
  };

  const handlePause = async () => {
    try { await aiPause(); } catch {}
  };

  const handleResume = async () => {
    try {
      await aiResume();
      setPaused(false);
    } catch {}
  };

  const handleCancel = async () => {
    try { await aiCancel(); } catch {}
  };

  const pct = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="card mb-6">
      <h2 className="text-lg font-semibold mb-4">AI Classification</h2>

      {/* Controls */}
      <div className="flex gap-4 items-end flex-wrap">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Scope</span>
          <select
            value={scope}
            onChange={e => setScope(e.target.value)}
            disabled={running}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm disabled:opacity-50"
          >
            <option value="unanalyzed">Unanalyzed Records</option>
            <option value="others">"Others" Classification Only</option>
            <option value="all">All Records</option>
          </select>
        </label>

        {!running && (
          <button
            onClick={handleStart}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium transition"
          >
            {result ? 'Start New Run' : 'Start AI Analysis'}
          </button>
        )}

        {running && (
          <>
            {!paused ? (
              <button
                onClick={handlePause}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-sm font-medium transition"
              >
                ⏸ Pause
              </button>
            ) : (
              <button
                onClick={handleResume}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded text-sm font-medium transition"
              >
                ▶ Resume
              </button>
            )}
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition"
            >
              ⏹ Cancel
            </button>
          </>
        )}
      </div>

      {/* Progress bar */}
      {progress && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>
              {progress.done !== undefined
                ? `${progress.done} / ${progress.total} classified`
                : `${progress.current} / ${progress.total}`}
              {paused && ' · ⏸ PAUSED'}
              {progress.errors > 0 && ` · ${progress.errors} errors`}
            </span>
            <span>{pct}%</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                paused
                  ? 'bg-yellow-500'
                  : result?.cancelled
                  ? 'bg-red-500'
                  : result
                  ? 'bg-emerald-500'
                  : 'bg-purple-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Current item being classified */}
      {currentItem && (
        <div className="mt-3 bg-purple-900/30 border border-purple-700/50 rounded p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            <span className="text-xs text-purple-300 font-semibold">
              Classifying {currentItem.index}/{currentItem.total}
            </span>
            <span className="text-xs text-gray-500">· {currentItem.docId}</span>
            {currentItem.hasImages > 0 && (
              <span className="text-xs text-gray-500">· 🖼 {currentItem.hasImages} image(s)</span>
            )}
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            {currentItem.description || <span className="text-gray-600 italic">No description</span>}
          </p>
          <div className="flex gap-3 mt-1.5 text-xs text-gray-500">
            {currentItem.hazard && <span>🏷 {currentItem.hazard}</span>}
            {currentItem.submitter && <span>👤 {currentItem.submitter}</span>}
            {currentItem.area && <span>📍 {currentItem.area}</span>}
          </div>
        </div>
      )}

      {/* Result log */}
      {logs.length > 0 && (
        <div className="mt-3 bg-gray-900 border border-gray-700 rounded p-3 max-h-80 overflow-y-auto font-mono text-xs">
          {logs.map((entry, i) => (
            <div
              key={i}
              className={`log-line ${
                entry.type === 'header'
                  ? 'text-white font-semibold border-b border-gray-700 pb-1 mb-1'
                  : entry.type === 'result'
                  ? 'text-emerald-300'
                  : entry.type === 'done'
                  ? 'text-emerald-400'
                  : entry.type === 'pause'
                  ? 'text-yellow-400'
                  : entry.type === 'warn'
                  ? 'text-orange-400'
                  : entry.type === 'error'
                  ? 'text-red-400'
                  : 'text-gray-400'
              }`}
            >
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
