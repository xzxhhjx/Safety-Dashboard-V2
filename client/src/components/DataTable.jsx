import { useState } from 'react';
import { classifyHazard, AI_CONFIDENCE_COLORS } from '../config';
import ImageModal from './ImageModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function statusBadgeClass(s) {
  if (!s) return 'badge badge-pending';
  const st = String(s).toLowerCase();
  if (st === 'closed' || st === '已关闭' || st === 'done') return 'badge badge-closed';
  if (st === 'open') return 'badge badge-open';
  if (st === 'overdue' || st === '逾期') return 'badge badge-overdue';
  return 'badge badge-pending';
}

export default function DataTable({ data, total, page, pageSize, onPageChange, onPageSizeChange, loading }) {
  const [modal, setModal] = useState({ open: false, images: [], index: 0 });
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      {loading ? (
        <div className="py-8 text-center" style={{ color: 'var(--text-tertiary)' }}>Loading...</div>
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
                  <th>AI Category</th>
                </tr>
              </thead>
              <tbody>
                {data.map(row => {
                  const fallback = classifyHazard(row.description, row.hazard);
                  const aiCat = row.ai_category || fallback.category;
                  const aiCatCN = row.ai_category_cn || fallback.cn;
                  const aiConf = row.ai_confidence || 'low';

                  return (
                    <tr key={row.id}>
                      <td className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{row.id}</td>
                      <td>
                        {Array.isArray(row.photos) && row.photos[0] && !row.photos[0].startsWith('__FAILED') ? (
                          <img
                            src={row.photos[0]}
                            alt=""
                            className="w-10 h-10 object-cover rounded-md cursor-pointer hover:opacity-80 transition flex-shrink-0"
                            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                            onClick={() => setModal({ open: true, images: row.photos, index: 0 })}
                          />
                        ) : (
                          <span
                            className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--text-secondary)', fontSize: 10 }}
                          >
                            —
                          </span>
                        )}
                      </td>
                      <td className="text-sm">{row.hazard || '—'}</td>
                      <td>
                        <span className={statusBadgeClass(row.status)}>
                          {row.status || '—'}
                        </span>
                      </td>
                      <td className="text-sm">{row.area || '—'}</td>
                      <td className="text-sm">{row.dept || '—'}</td>
                      <td className="max-w-[220px]">
                        <div className="line-clamp-2 text-sm" title={row.description}>
                          {row.description || '—'}
                        </div>
                      </td>
                      <td className="text-sm">{row.submitter || '—'}</td>
                      <td className="text-xs" style={{ color: 'var(--text-secondary)' }}>{row.obs_time || '—'}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: AI_CONFIDENCE_COLORS[aiConf] || '#8E8E93' }}
                          />
                          <span className="text-xs">{aiCatCN}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center" style={{ color: 'var(--text-tertiary)', padding: '32px 0' }}>
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Page {page} of {totalPages || 1}
              </span>
              <label className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                Show
                <select
                  value={pageSize}
                  onChange={e => onPageSizeChange(Number(e.target.value))}
                  className="input-apple"
                  style={{ padding: '2px 8px', height: 28, fontSize: 12 }}
                >
                  {PAGE_SIZE_OPTIONS.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="pagination-btn"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="pagination-btn"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
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
