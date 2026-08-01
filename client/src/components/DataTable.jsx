import { useState, useCallback } from 'react';
import { classifyHazard, AI_CONFIDENCE_COLORS } from '../config';
import ImageModal from './ImageModal';
import Badge from './ui/Badge';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const DEFAULT_COLUMNS = [
  { key: 'id', label: 'ID', width: 80 },
  { key: 'photo', label: 'Photo', width: 56 },
  { key: 'hazard', label: 'Hazard', width: 160 },
  { key: 'status', label: 'Status', width: 100 },
  { key: 'area', label: 'Area', width: 120 },
  { key: 'dept', label: 'Dept', width: 120 },
  { key: 'description', label: 'Description', flex: 1 },
  { key: 'submitter', label: 'Submitter', width: 100 },
  { key: 'date', label: 'Date', width: 110 },
  { key: 'ai_category', label: 'AI Category', width: 130 },
];

export default function DataTable({
  data, total, page, pageSize, onPageChange, onPageSizeChange, loading,
  selectable = false, onSelectionChange, onExport, columns,
}) {
  const [modal, setModal] = useState({ open: false, images: [], index: 0 });
  const [selected, setSelected] = useState(new Set());
  const totalPages = Math.ceil(total / pageSize);
  const cols = columns || DEFAULT_COLUMNS;

  const toggleSelect = useCallback((id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      onSelectionChange?.(next);
      return next;
    });
  }, [onSelectionChange]);

  const toggleAll = useCallback(() => {
    setSelected(prev => {
      const next = prev.size === data.length ? new Set() : new Set(data.map(r => r.id));
      onSelectionChange?.(next);
      return next;
    });
  }, [data, onSelectionChange]);

  const renderCell = (row, col) => {
    switch (col.key) {
      case 'photo':
        return Array.isArray(row.photos) && row.photos[0] && !row.photos[0].startsWith('__FAILED') ? (
          <img src={row.photos[0]} alt="" className="w-10 h-10 object-cover rounded-md cursor-pointer hover:opacity-80 transition"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
            onClick={() => setModal({ open: true, images: row.photos, index: 0 })} />
        ) : (
          <span className="w-10 h-10 rounded-md flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--text-secondary)', fontSize: 10 }}>—</span>
        );
      case 'status':
        return <Badge status={row.status}>{row.status || '—'}</Badge>;
      case 'description':
        return (
          <div className="line-clamp-2 text-sm max-w-[240px]" title={row.description}>
            {row.description || '—'}
          </div>
        );
      case 'date':
        return <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{row.obs_time || '—'}</span>;
      case 'ai_category': {
        const fallback = classifyHazard(row.description, row.hazard);
        const aiCat = row.ai_category || fallback.category;
        const aiCatCN = row.ai_category_cn || fallback.cn;
        const aiConf = row.ai_confidence || 'low';
        return (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: AI_CONFIDENCE_COLORS[aiConf] || '#8E8E93' }} />
            <span className="text-xs">{aiCatCN}</span>
          </div>
        );
      }
      default:
        return <span className="text-sm">{row[col.key] ?? '—'}</span>;
    }
  };

  return (
    <div>
      {/* Toolbar: selection count + export */}
      {(selectable || onExport) && (
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {selectable && selected.size > 0 && `${selected.size} selected`}
          </div>
          {onExport && (
            <button onClick={onExport} className="btn-secondary text-xs">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center" style={{ color: 'var(--text-tertiary)' }}>Loading...</div>
      ) : (
        <>
          <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
            <table className="data-table w-full">
              <thead>
                <tr>
                  {selectable && (
                    <th style={{ width: 40 }}>
                      <input type="checkbox" checked={data.length > 0 && selected.size === data.length}
                        onChange={toggleAll} />
                    </th>
                  )}
                  {cols.map(c => (
                    <th key={c.key} style={c.width ? { width: c.width } : {}}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map(row => (
                  <tr key={row.id} className={selected.has(row.id) ? 'selected' : ''}
                    style={selected.has(row.id) ? { background: 'rgba(0,122,255,0.06)' } : {}}>
                    {selectable && (
                      <td>
                        <input type="checkbox" checked={selected.has(row.id)}
                          onChange={() => toggleSelect(row.id)} />
                      </td>
                    )}
                    {cols.map(c => (
                      <td key={c.key}>{renderCell(row, c)}</td>
                    ))}
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={cols.length + (selectable ? 1 : 0)} className="text-center"
                      style={{ color: 'var(--text-tertiary)', padding: '32px 0' }}>
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
                <select value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))}
                  className="input-apple" style={{ padding: '2px 8px', height: 28, fontSize: 12 }}>
                  {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="pagination-btn">
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="pagination-btn">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}

      {modal.open && (
        <ImageModal images={modal.images} initialIndex={modal.index}
          onClose={() => setModal({ open: false, images: [], index: 0 })} />
      )}
    </div>
  );
}
