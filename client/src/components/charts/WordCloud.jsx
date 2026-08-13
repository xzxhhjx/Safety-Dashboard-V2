import BaseChart from './BaseChart';
import { CHART_COLORS } from '../../config';
import { useLanguage } from '../../context/LanguageContext';
import 'echarts-wordcloud';

export default function WordCloud({ data }) {
  const { t } = useLanguage();

  if (!data?.length) return <div className="chart-container flex items-center justify-center text-gray-600">{t('common.noData')}</div>;

  const option = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'wordCloud',
      shape: 'circle',
      left: 'center',
      top: 'center',
      width: '90%',
      height: '90%',
      sizeRange: [14, 48],
      rotationRange: [-30, 30],
      rotationStep: 15,
      gridSize: 8,
      drawOutOfBound: false,
      layoutAnimation: true,
      textStyle: {
        fontFamily: 'sans-serif',
        fontWeight: 'bold',
        color: () => CHART_COLORS[Math.floor(Math.random() * CHART_COLORS.length)],
      },
      data: data.map(d => ({ name: d.name, value: d.value })),
    }],
  };

  return <div className="chart-container-tall"><BaseChart option={option} height="100%" /></div>;
}
