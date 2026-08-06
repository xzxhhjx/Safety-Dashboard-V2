import { useState, useCallback } from 'react';
import ImageModal from './ImageModal';
import Badge from './ui/Badge';
import { ChevronLeft, ChevronRight, Download, Image } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const DEFAULT_COLUMNS = [
  { key: 'obs_time', label: '提交时间', width: 150 },
  { key: 'submitter', label: '提交人', width: 90 },
  { key: 'dept', label: '提交人部门', width: 120 },
  { key: 'area', label: '隐患所在区域', width: 130 },
  { key: 'obs_type', label: '属性', width: 72 },
  { key: 'hazard', label: '隐患类型', width: 140 },
  { key: 'description', label: '描述', width: 200 },
  { key: 'measures', label: '采取的措施', width: 160 },
  { key: 'status', label: '当前状态', width: 100 },
  { key: 'photos', label: '图片', width: 70 },
];

export default function DataTable({
  data, total, page, pageSize, onPageChange, onPageSizeChange, loading,
  selectable = false, onSelectionChange, onExport, columns,
  hidePagination = false,
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
      case 'obs_time': {
        const d = row.obs_time ? String(row.obs_time).slice(0, 10) : '';
        return <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{d || '—'}</span>;
      }
      case 'obs_type': {
        const type = (row.obs_type || '').toLowerCase();
        const isSafe = type.includes('positive') || type.includes('good') || type.includes('标准');
        const isUnsafe = type.includes('negative') || type.includes('unsafe') || type.includes('不安全');
        return (
          <span className="badge" style={{
            background: isSafe ? 'rgba(52,199,89,0.12)' : isUnsafe ? 'rgba(255,69,58,0.12)' : 'rgba(142,142,147,0.12)',
            color: isSafe ? '#248A3D' : isUnsafe ? '#C44235' : '#5C5C5E',
          }}>
            {isSafe ? 'Safe' : isUnsafe ? 'Risk' : '—'}
          </span>
        );
      }
      case 'status':
        return <Badge status={row.status}>{row.status || '—'}</Badge>;
      case 'description':
        return (
          <div className="text-sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} title={row.description}>
            {row.description || '—'}
          </div>
        );
      case 'measures':
        return (
          <div className="line-clamp-2 text-xs max-w-[200px]" title={row.measures}>
            {row.measures || '—'}
          </div>
        );
      case 'photos': {
        const hasPhotos = Array.isArray(row.photos) && row.photos.length > 0
          && row.photos.some(p => p && !p.startsWith('__FAILED'));
        return hasPhotos ? (
          <button
            className="btn-secondary flex items-center gap-1"
            style={{ padding: '4px 10px', height: 28, fontSize: 12, whiteSpace: 'nowrap' }}
            onClick={() => setModal({ open: true, images: row.photos.filter(p => p && !p.startsWith('__FAILED')), index: 0 })}
            title="点击查看图片"
          >
            <Image className="w-3.5 h-3.5" />
            查看
          </button>
        ) : (
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>—</span>
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
          {!hidePagination && (
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
          )}
        </>
      )}

      {modal.open && (
        <ImageModal images={modal.images} initialIndex={modal.index}
          onClose={() => setModal({ open: false, images: [], index: 0 })} />
      )}
    </div>
  );
}
