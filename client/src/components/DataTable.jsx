import { useState, useCallback } from 'react';
import ImageModal from './ImageModal';
import Badge from './ui/Badge';
import { ChevronLeft, ChevronRight, Download, Image } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function DataTable({
  data, total, page, pageSize, onPageChange, onPageSizeChange, loading,
  selectable = false, onSelectionChange, onExport, columns,
  hidePagination = false,
}) {
  const [modal, setModal] = useState({ open: false, images: [], index: 0 });
  const [selected, setSelected] = useState(new Set());
  const { t } = useLanguage();
  const totalPages = Math.ceil(total / pageSize);

  const defaultColumns = [
    { key: 'obs_time',   label: t('table.col.time'),        width: 150 },
    { key: 'submitter',  label: t('table.col.submitter'),   width: 90 },
    { key: 'dept',       label: t('table.col.dept'),        width: 120 },
    { key: 'area',       label: t('table.col.area'),        width: 130 },
    { key: 'obs_type',   label: t('table.col.obsType'),     width: 72 },
    { key: 'hazard',     label: t('table.col.hazard'),      width: 140 },
    { key: 'description',label: t('table.col.description'), width: 200 },
    { key: 'measures',   label: t('table.col.measures'),    width: 160 },
    { key: 'status',     label: t('table.col.status'),      width: 100 },
    { key: 'photos',     label: t('table.col.photos'),      width: 70 },
  ];
  const cols = columns || defaultColumns;

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
            {isSafe ? t('table.safe') : isUnsafe ? t('table.risk') : '—'}
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
            title={t('table.viewPhotosTitle')}
          >
            <Image className="w-3.5 h-3.5" />
            {t('table.viewPhotos')}
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
            {selectable && selected.size > 0 && t('table.selected', { n: selected.size })}
          </div>
          {onExport && (
            <button onClick={onExport} className="btn-secondary text-xs">
              <Download className="w-3.5 h-3.5" /> {t('common.exportCsv')}
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center" style={{ color: 'var(--text-tertiary)' }}>{t('common.loading')}</div>
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
                      {t('common.noRecords')}
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
                {t('table.pageOf', { page, total: totalPages || 1 })}
              </span>
              <label className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                {t('common.show')}
                <select value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))}
                  className="input-apple" style={{ padding: '2px 8px', height: 28, fontSize: 12 }}>
                  {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="pagination-btn">
                <ChevronLeft className="w-3.5 h-3.5" /> {t('common.prev')}
              </button>
              <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="pagination-btn">
                {t('common.next')} <ChevronRight className="w-3.5 h-3.5" />
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
