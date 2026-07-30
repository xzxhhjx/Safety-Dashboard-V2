import { useState } from 'react';
import { uploadExcel } from '../api';

export default function ExcelUpload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Uploading and processing...');
    try {
      const result = await uploadExcel(file);
      setStatus(`Done! ${result.count} records saved (${result.total} rows total).`);
    } catch (err) {
      setStatus(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mb-6">
      <h2 className="text-lg font-semibold mb-4">Upload Excel Data</h2>
      <div className="flex gap-4 items-center">
        <input type="file" accept=".xlsx,.xls,.csv"
          onChange={e => setFile(e.target.files[0])}
          className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-700 file:text-white hover:file:bg-gray-600" />
        <button onClick={handleUpload} disabled={!file || loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition disabled:opacity-50">
          {loading ? 'Processing...' : 'Upload & Sync'}
        </button>
      </div>
      {status && <p className={`mt-3 text-sm ${status.startsWith('Done') ? 'text-emerald-400' : 'text-gray-400'}`}>{status}</p>}
    </div>
  );
}
