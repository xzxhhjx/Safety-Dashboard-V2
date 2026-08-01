import * as echarts from 'echarts';

const APPLE_PALETTE = [
  '#007AFF', '#34C759', '#FF9F0A', '#FF453A',
  '#5856D6', '#8E8E93', '#FF6B35', '#00C7BE',
  '#AF52DE', '#FF2D55', '#30B0C7', '#FFD60A',
  '#32D74B', '#BF5AF2', '#64D2FF', '#AEAEB2',
];

echarts.registerTheme('apple-enterprise', {
  color: APPLE_PALETTE,
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: '"SF Pro Display", "SF Pro Text", "PingFang SC", sans-serif',
  },
  title: {
    textStyle: { color: '#1D1D1F', fontWeight: 600, fontSize: 15 },
    subtextStyle: { color: '#6E6E73', fontSize: 13 },
  },
  legend: {
    textStyle: { color: '#6E6E73', fontSize: 12 },
    itemWidth: 8,
    itemHeight: 8,
    itemGap: 12,
    icon: 'roundRect',
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderColor: 'rgba(0, 0, 0, 0.06)',
    borderWidth: 0.5,
    textStyle: { color: '#1D1D1F', fontSize: 13 },
    extraCssText: 'backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);',
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: 'rgba(0,0,0,0.08)' } },
    axisTick: { show: false },
    axisLabel: { color: '#6E6E73', fontSize: 11 },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#6E6E73', fontSize: 11 },
    splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)', type: 'dashed' } },
  },
  grid: {
    top: 12,
    left: 12,
    right: 24,
    bottom: 12,
    containLabel: true,
  },
});
