import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Hazard category accordion list — companion to HazardChart donut.
 *
 * Renders each category as a clickable row with:
 * - Color dot + English name + Chinese name
 * - Percentage + count badge
 * - Expandable sub-categories (raw hazard names with counts)
 *
 * Matches the original Safety-Dashboard renderHazardList() behavior.
 */
export default function HazardList({ categories, onItemClick }) {
  if (!categories?.length) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: '#94a3b8', fontSize: 13 }}>
        —
      </div>
    );
  }

  const total = categories.reduce((s, c) => s + c.value, 0);

  return (
    <ul className="space-y-0.5 pr-1">
      {categories.map(item => {
        const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) + '%' : '0%';
        const subs = item.subs || [];
        const sortedSubs = [...subs].sort((a, b) => b.value - a.value);
        const hasSubs = sortedSubs.length > 1;

        return (
          <HazardListItem
            key={item.name}
            item={item}
            percentage={percentage}
            subs={sortedSubs}
            hasSubs={hasSubs}
            onItemClick={onItemClick}
          />
        );
      })}
    </ul>
  );
}

function HazardListItem({ item, percentage, subs, hasSubs, onItemClick }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const subId = 'hazardSub_' + item.name.replace(/[^a-zA-Z0-9一-鿿]/g, '_');

  const handleHeaderClick = () => {
    if (hasSubs) {
      setOpen(o => !o);
    } else {
      onItemClick?.('hazard', item.name);
    }
  };

  return (
    <li className="group">
      {/* Header row */}
      <div
        className="flex items-center justify-between p-2 rounded cursor-pointer transition hover:bg-slate-100/50"
        onClick={handleHeaderClick}
        title={`${item.name}\n${item.cn || ''}`}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-slate-700 truncate">{item.name}</span>
            <span className="text-[10px] text-slate-400 truncate">{item.cn || ''}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-slate-400">{percentage}</span>
          <span className="text-xs font-bold text-slate-500 bg-white/60 border border-slate-200/50 px-1.5 rounded min-w-[24px] text-center">
            {item.value}
          </span>
          {hasSubs && (
            <div className={`text-slate-400 p-0.5 transition-transform ${open ? 'rotate-180' : ''}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Sub-category list */}
      {hasSubs && open && (
        <ul className="ml-6 space-y-1 border-l-2 border-slate-200/50 pl-2 mt-1">
          {subs.map(sub => (
            <li
              key={sub.name}
              className="text-[11px] text-slate-500 flex justify-between items-start py-1 border-b border-slate-100/50 last:border-0 hover:bg-slate-50/50 rounded px-1 cursor-pointer"
              title={`${t('hazardList.filterBy')}: ${sub.name}`}
              onClick={e => { e.stopPropagation(); onItemClick?.('hazard', sub.name); }}
            >
              <span className="break-all pr-2">{sub.name}</span>
              <span className="text-[10px] bg-slate-100/50 text-slate-600 px-1 rounded flex-shrink-0">{sub.value}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
