import { useEffect, useRef } from 'react';
// NOTE: Using full 'echarts' import for simplicity (~1.3MB).
// TODO: Switch to modular imports (echarts/core, echarts/charts, echarts/components, echarts/renderers)
//       to reduce bundle size to ~200-300KB. Register components once in a shared init file.
import * as echarts from 'echarts';

export default function BaseChart({ option, height = '400px' }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    chartRef.current = echarts.init(ref.current, null, { renderer: 'canvas' });
    return () => chartRef.current?.dispose();
  }, []);

  useEffect(() => {
    if (chartRef.current && option) {
      chartRef.current.setOption(option, true);
    }
  }, [option]);

  useEffect(() => {
    const handleResize = () => chartRef.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <div ref={ref} style={{ width: '100%', height }} />;
}
