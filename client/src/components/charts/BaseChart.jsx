import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import '../../styles/echarts-theme.js'; // registers 'apple-enterprise'

export default function BaseChart({ option, height = '400px' }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, 'apple-enterprise', { renderer: 'canvas' });
    chartRef.current = chart;

    // ResizeObserver — re-layout chart when container size changes (grid/flexbox/tab-switch)
    const ro = new ResizeObserver(() => {
      chart.resize();
    });
    ro.observe(ref.current);

    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (chartRef.current && option) {
      chartRef.current.setOption(option, true);
      // Force resize after option update so the chart fills its container
      chartRef.current.resize();
    }
  }, [option]);

  return <div ref={ref} style={{ width: '100%', height }} />;
}
