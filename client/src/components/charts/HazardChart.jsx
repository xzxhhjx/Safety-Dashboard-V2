import BaseChart from './BaseChart';
import { CHART_COLORS } from '../../config';

export default function HazardChart({ data }) {
  if (!data?.length) return <div className="chart-container flex items-center justify-center text-gray-600">No data</div>;

  const total = data.reduce((sum, d) => sum + d.value, 0);

  const pieData = data.map((d, i) => ({
    name: d.name,
    value: d.value,
    itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] },
  }));

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(17, 24, 39, 0.92)',
      borderColor: '#374151',
      textStyle: { color: '#E5E7EB', fontSize: 13 },
      formatter: (params) =>
        `<div style="font-weight:600;margin-bottom:2px">${params.name}</div>` +
        `<div style="color:#9CA3AF">${params.value} 项 (${params.percent}%)</div>`,
    },
    series: [{
      type: 'pie',
      radius: ['48%', '75%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 4,
        borderColor: '#111827',
        borderWidth: 3,
      },
      label: {
        show: true,
        position: 'outside',
        formatter: '{b}',
        color: '#9CA3AF',
        fontSize: 11,
        distanceToLabelLine: 4,
      },
      labelLine: {
        lineStyle: { color: '#4B5563' },
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 15,
          fontWeight: 'bold',
          formatter: '{b}\n{c} 项 ({d}%)',
          lineHeight: 18,
        },
        scale: true,
        scaleSize: 8,
      },
      data: pieData,
    }],
  };

  return <div className="chart-container-tall"><BaseChart option={option} height="100%" /></div>;
}
