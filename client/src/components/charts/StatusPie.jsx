import BaseChart from './BaseChart';
import { COLORS } from '../../config';

const STATUS_COLORS = { 'Open': COLORS.DANGER, 'Closed': COLORS.SAFE, '已关闭': COLORS.SAFE, 'In Progress': COLORS.WARN };

export default function StatusPie({ data }) {
  if (!data?.length) return <div className="chart-container flex items-center justify-center text-gray-600">No data</div>;

  const option = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      data: data.map(d => ({ ...d, itemStyle: { color: STATUS_COLORS[d.name] || COLORS.NEUTRAL } })),
      label: { color: '#9CA3AF', fontSize: 11 },
    }],
  };

  return <div className="chart-container"><BaseChart option={option} /></div>;
}
