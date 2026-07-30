import { useState } from 'react';
import { classifyBatch, classifySingle } from '../api';

export default function AIClassifyPanel() {
  const [scope, setScope] = useState('unanalyzed');
  const [status, setStatus] = useState('');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const handleStart = async () => {
    setRunning(true);
    setProgress({ done: 0, total: 0 });

    try {
      // Step 1: Get list of docIds to process
      const { docIds } = await classifyBatch({ scope });
      setProgress({ done: 0, total: docIds.length });
      setStatus(`Processing ${docIds.length} records...`);

      // Step 2: Process one by one with delay
      for (let i = 0; i < docIds.length; i++) {
        await classifySingle({ docId: docIds[i] });
        setProgress({ done: i + 1, total: docIds.length });
        // Delay 500ms between requests
        if (i < docIds.length - 1) {
          await new Promise(r => setTimeout(r, 500));
        }
      }

      setStatus(`Complete! ${docIds.length} records analyzed.`);
    } catch (err) {
      setStatus(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="card mb-6">
      <h2 className="text-lg font-semibold mb-4">AI Classification</h2>
      <div className="flex gap-4 items-end">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Scope</span>
          <select value={scope} onChange={e => setScope(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm">
            <option value="unanalyzed">Unanalyzed Records</option>
            <option value="others">"Others" Classification Only</option>
            <option value="all">All Records</option>
          </select>
        </label>
        <button onClick={handleStart} disabled={running}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium transition disabled:opacity-50">
          {running ? 'Processing...' : 'Start AI Analysis'}
        </button>
      </div>

      {running && progress.total > 0 && (
        <div className="mt-3">
          <div className="text-sm text-gray-400 mb-1">{progress.done} / {progress.total}</div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
        </div>
      )}

      {status && !running && (
        <p className={`mt-3 text-sm ${status.startsWith('Complete') ? 'text-emerald-400' : status.startsWith('Error') ? 'text-red-400' : 'text-gray-400'}`}>
          {status}
        </p>
      )}
    </div>
  );
}
