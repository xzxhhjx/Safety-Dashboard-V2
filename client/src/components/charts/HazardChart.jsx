import { useEffect, useMemo } from 'react';
import BaseChart from './BaseChart';
import { CHART_COLORS } from '../../config';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Hazard Distribution — Donut chart matching original Safety-Dashboard style.
 *
 * - Shows English category name as primary label, Chinese as subtitle
 * - Legend hidden (companion HazardList provides the labels)
 * - Supports limit: 5, 10, or 'all'
 * - Returns processed categories for the accordion list
 */
export default function HazardChart({ data, subData, limit = 'all', onProcessed }) {
  const { t } = useLanguage();

  const chartData = useMemo(() => {
    if (!data?.length) return [];

    // Map to unified format: { name (EN), cn, value, color }
    let categories = data.map((d, i) => ({
      name: d.category || d.name,
      cn: d.category ? d.name : (d.cn || ''),
      value: d.value,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));

    // Push Others to the end
    categories.sort((a, b) => {
      if (a.name === 'Others') return 1;
      if (b.name === 'Others') return -1;
      return b.value - a.value;
    });

    // Apply limit
    if (limit !== 'all') {
      const lim = parseInt(limit, 10);
      if (categories.length > lim) {
        categories = categories.slice(0, lim);
      }
    }

    // Attach sub-category data from subData
    if (subData?.length) {
      categories = categories.map(cat => {
        const sub = subData.find(s => s.category === cat.name);
        return { ...cat, subs: sub ? sub.subs : [] };
      });
    }

    return categories;
  }, [data, subData, limit]);

  // Notify parent of processed data (for accordion list)
  useEffect(() => {
    if (onProcessed) onProcessed(chartData);
  }, [chartData, onProcessed]);

  const option = useMemo(() => {
    if (!chartData.length) return null;

    const seriesData = chartData.map(d => ({
      name: d.name,
      value: d.value,
      cn: d.cn,
      itemStyle: { color: d.color },
    }));

    return {
      tooltip: {
        trigger: 'item',
        formatter(params) {
          return `<div style="font-weight:bold">${params.name}</div>
                  <div style="color:#64748b">${params.data.cn || ''}</div>
                  <div>${params.value} ${t('common.items')} (${params.percent}%)</div>`;
        },
      },
      legend: { show: false },
      series: [{
        name: t('charts.hazardSeries'),
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold', formatter: '{b}\n{c}\n{d}%', lineHeight: 18 },
          scale: true,
          scaleSize: 10,
        },
        data: seriesData,
      }],
    };
  }, [chartData, t]);

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: '#94a3b8', fontSize: 13 }}>
        {t('common.noData')}
      </div>
    );
  }

  return (
    <div style={{ flex: 1, minHeight: 380 }}>
      <BaseChart option={option} height="100%" />
    </div>
  );
}
