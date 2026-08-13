import { useMemo } from 'react';
import BaseChart from './BaseChart';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Area × Hazard Category Heatmap — matches original Safety-Dashboard heatmap.
 *
 * X-axis: main work areas (sorted by total count, "Others" last)
 * Y-axis: hazard categories (sorted by total count, "Others" last)
 * Cells: colored by observation count (white → blue gradient)
 * Click: returns { area, hazard } for drill-down filtering
 */
export default function HeatmapChart({ data, onCellClick }) {
  const { t } = useLanguage();

  const { areas, hazards, seriesData, maxVal } = useMemo(() => {
    if (!data?.length) return { areas: [], hazards: [], seriesData: [], maxVal: 5 };

    // Count per area and hazard for sorting
    const areaCounts = {};
    const hazardCounts = {};
    const matrix = new Map();

    for (const row of data) {
      const a = row.area || 'Others';
      const h = row.hazard_category || 'Others';
      areaCounts[a] = (areaCounts[a] || 0) + row.cnt;
      hazardCounts[h] = (hazardCounts[h] || 0) + row.cnt;
      matrix.set(`${a}|${h}`, (matrix.get(`${a}|${h}`) || 0) + row.cnt);
    }

    // Sort: Others last
    const pushLast = (entries) => {
      const others = [];
      const rest = [];
      for (const [name, count] of entries) {
        if (name === 'Others' || name === '其他' || name === '其他 (Other)') {
          others.push(name);
        } else {
          rest.push({ name, count });
        }
      }
      rest.sort((a, b) => b.count - a.count);
      return [...rest.map(r => r.name), ...others];
    };

    const areasList = pushLast(Object.entries(areaCounts));
    const hazardsList = pushLast(Object.entries(hazardCounts));

    // Build ECharts heatmap data: [[xIdx, yIdx, count], ...]
    const cells = [];
    let max = 0;
    areasList.forEach((area, xIdx) => {
      hazardsList.forEach((hazard, yIdx) => {
        const count = matrix.get(`${area}|${hazard}`) || 0;
        if (count > 0) {
          cells.push([xIdx, yIdx, count]);
          if (count > max) max = count;
        }
      });
    });

    return { areas: areasList, hazards: hazardsList, seriesData: cells, maxVal: Math.max(max, 5) };
  }, [data]);

  const option = useMemo(() => {
    if (!seriesData.length) return null;

    return {
      tooltip: {
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderColor: 'rgba(0,0,0,0.06)',
        borderWidth: 1,
        textStyle: { color: '#1D1D1F', fontSize: 12 },
        formatter(params) {
          const areaName = areas[params.data[0]];
          const hazardName = hazards[params.data[1]];
          const count = params.data[2];
          return `<div style="font-size:11px;color:#6E6E73;margin-bottom:2px">${hazardName}</div>
                  <div style="font-weight:600;font-size:13px;margin-bottom:4px">${areaName}</div>
                  <div style="display:flex;align-items:center;gap:6px">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${params.color}"></span>
                    <span style="font-weight:600">${count} ${t('common.items')}</span>
                  </div>`;
        },
      },
      grid: { top: 8, bottom: 70, left: 20, right: 80, containLabel: true },
      xAxis: {
        type: 'category',
        data: areas,
        position: 'top',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          rotate: 45,
          color: '#6E6E73',
          fontSize: 10,
          fontFamily: 'inherit',
        },
        splitArea: {
          show: true,
          areaStyle: { color: ['rgba(0,0,0,0.01)', 'rgba(0,0,0,0.03)'] },
        },
      },
      yAxis: {
        type: 'category',
        data: hazards,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#1D1D1F',
          fontSize: 11,
          fontFamily: 'inherit',
        },
      },
      visualMap: {
        min: 0,
        max: maxVal,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 4,
        itemWidth: 24,
        itemHeight: 200,
        text: [t('charts.high'), t('charts.low')],
        textStyle: { color: '#6E6E73', fontSize: 11, fontFamily: 'inherit' },
        inRange: {
          color: ['#F5F5F7', '#DBEAFE', '#93C5FD', '#3B82F6', '#1D4ED8', '#1E3A5F'],
        },
      },
      series: [{
        type: 'heatmap',
        data: seriesData,
        label: {
          show: true,
          color: '#1D1D1F',
          fontSize: 10,
          fontFamily: 'inherit',
        },
        itemStyle: {
          borderColor: 'rgba(255,255,255,0.6)',
          borderWidth: 2,
          borderRadius: 4,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 8,
            shadowColor: 'rgba(0,0,0,0.15)',
            borderColor: '#007AFF',
            borderWidth: 2,
          },
        },
      }],
    };
  }, [areas, hazards, seriesData, maxVal, t]);

  const handleClick = (params) => {
    if (onCellClick && params.data) {
      onCellClick({
        area: areas[params.data[0]],
        hazard: hazards[params.data[1]],
      });
    }
  };

  if (!seriesData.length) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 320, color: '#94a3b8', fontSize: 13 }}>
        {t('charts.noHeatmap')}
      </div>
    );
  }

  return (
    <BaseChart option={option} height={600} onEvents={{ click: handleClick }} />
  );
}
