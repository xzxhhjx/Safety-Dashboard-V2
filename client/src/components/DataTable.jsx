import { useState } from 'react';
import { classifyHazard, AI_CONFIDENCE_COLORS } from '../config';
import ImageModal from './ImageModal';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function DataTable({ data, total, page, pageSize, onPageChange, onPageSizeChange, loading }) {
  const [modal, setModal] = useState({ open: false, images: [], index: 0 });
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Records ({total})</h2>

      {loading ? (
        <div className="text-gray-500 py-8 text-center">Loading...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Photo</th>
                  <th>Hazard</th>
                  <th>Status</th>
                  <th>Area</th>
                  <th>Dept</th>
                  <th>Description</th>
                  <th>Submitter</th>
                  <th>Date</th>
                  <th>AI Classification</th>
                </tr>
              </thead>
              <tbody>
                {data.map(row => {
                  const fallback = classifyHazard(row.description, row.hazard);
                  const aiCat = row.ai_category || fallback.category;
                  const aiCatCN = row.ai_category_cn || fallback.cn;
                  const aiConf = row.ai_confidence || 'low';

                  return (
                    <tr key={row.id} className="hover:bg-gray-800/30 transition">
                      <td className="font-mono text-xs">{row.id}</td>
                      <td>
                        {Array.isArray(row.photos) && row.photos[0] && !row.photos[0].startsWith('__FAILED') ? (
                          <img src={row.photos[0]} alt="" className="w-10 h-10 object-cover rounded cursor-pointer"
                            onClick={() => setModal({ open: true, images: row.photos, index: 0 })} />
                        ) : <span className="text-gray-600">—</span>}
                      </td>
                      <td>{row.hazard || '—'}</td>
                      <td>
                        <span className={`badge ${(row.status === 'Closed' || row.status === '已关闭') ? 'badge-high' : 'badge-medium'}`}>
                          {row.status || '—'}
                        </span>
                      </td>
                      <td>{row.area || '—'}</td>
                      <td>{row.dept || '—'}</td>
                      <td className="max-w-xs truncate" title={row.description}>{row.description || '—'}</td>
                      <td>{row.submitter || '—'}</td>
                      <td className="text-xs">{row.obs_time || '—'}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: AI_CONFIDENCE_COLORS[aiConf] || '#64748B' }} />
                          <span className="text-xs">{aiCatCN}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {data.length === 0 && (
                  <tr><td colSpan={10} className="text-center py-8 text-gray-600">No records found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Page {page} of {totalPages || 1}</span>
              <label className="flex items-center gap-1.5 text-xs text-gray-500">
                Show
                <select
                  value={pageSize}
                  onChange={e => onPageSizeChange(Number(e.target.value))}
                  className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
                >
                  {PAGE_SIZE_OPTIONS.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
                className="px-3 py-1 text-sm rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                Prev
              </button>
              <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
                className="px-3 py-1 text-sm rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {modal.open && (
        <ImageModal
          images={modal.images}
          initialIndex={modal.index}
          onClose={() => setModal({ open: false, images: [], index: 0 })}
        />
      )}
    </div>
  );
}
