import { useState, useRef, useEffect } from 'react';
import { classifyBatchStream, aiPause, aiResume, aiCancel } from '../api';
import { useLanguage } from '../context/LanguageContext';
import { Pause, Play, Square, Image, Tag, User, MapPin } from 'lucide-react';

const LOG_COLORS = {
  header: '#1D1D1F',
  result: '#248A3D',
  done: '#34C759',
  pause: '#B25E00',
  warn: '#B25E00',
  error: '#C44235',
  info: '#6E6E73',
};

export default function AIClassifyPanel() {
  const { t } = useLanguage();
  const [provider, setProvider] = useState('gemini');
  const [scope, setScope] = useState('unanalyzed');
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [logs, setLogs] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, currentItem]);

  const addLog = (text, type = 'info') => {
    setLogs(prev => [...prev, { text, type, time: new Date().toLocaleTimeString() }]);
  };

  const handleStart = async () => {
    setRunning(true);
    setPaused(false);
    setLogs([]);
    setCurrentItem(null);
    setProgress(null);
    setResult(null);

    try {
      for await (const event of classifyBatchStream({ scope, provider })) {
        switch (event.type) {
          case 'start':
            setProgress({ current: 0, total: event.total, done: 0, errors: 0 });
            addLog(event.message, event.providerAvailable ? 'info' : 'warn');
            if (!event.providerAvailable) {
              addLog(`${event.provider.toUpperCase()} ${t('ai.keyMissing')}`, 'warn');
            }
            addLog(t('ai.providerLine', { p: event.provider, s: event.scope, n: event.total }), 'info');
            break;

          case 'classifying':
            setCurrentItem({
              index: event.index, total: event.total, docId: event.docId,
              description: event.description, hazard: event.hazard,
              submitter: event.submitter, area: event.area, hasImages: event.hasImages,
            });
            break;

          case 'result':
            setCurrentItem(null);
            addLog(`${event.index}/${event.total}  ${event.docId}  →  ${event.category}  [${event.confidence}]  (${event.method})`, 'result');
            break;

          case 'log':
            addLog(event.message, event.phase === 'error' ? 'error' : event.phase === 'warn' ? 'warn' : 'info');
            break;

          case 'progress':
            setProgress({ current: event.current, total: event.total, done: event.done, errors: event.errors });
            break;

          case 'paused':
            setPaused(true); setCurrentItem(null);
            addLog(t('ai.pausedAt', { done: event.done, total: event.total }), 'pause');
            break;

          case 'cancelled':
            setCurrentItem(null);
            setResult({ cancelled: true, done: event.done, total: event.total });
            addLog(event.message, 'warn');
            setRunning(false); setPaused(false);
            break;

          case 'done':
            setCurrentItem(null);
            setProgress({ current: event.total, total: event.total, done: event.done, errors: event.errors });
            setResult({ done: event.done, total: event.total, skipped: event.skipped, errors: event.errors });
            addLog(t('ai.complete', { done: event.done, skipped: event.skipped, errors: event.errors }), 'done');
            setRunning(false); setPaused(false);
            break;

          case 'error':
            addLog(t('ai.fatal', { msg: event.message }), 'error');
            setRunning(false); setPaused(false);
            break;
        }
      }
    } catch (err) {
      addLog(t('ai.connError', { msg: err.message }), 'error');
    } finally {
      setRunning(false); setPaused(false);
    }
  };

  const handlePause = async () => { try { await aiPause(); } catch {} };
  const handleResume = async () => { try { await aiResume(); setPaused(false); } catch {} };
  const handleCancel = async () => { try { await aiCancel(); } catch {} };

  const pct = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  const progressColor = paused ? 'var(--system-orange)'
    : result?.cancelled ? 'var(--system-red)'
    : result ? 'var(--system-green)'
    : 'var(--system-purple)';

  return (
    <div className="card mb-6">
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        {t('ai.title')}
      </h2>

      <div className="flex gap-4 items-end flex-wrap">
        <label className="flex flex-col gap-1">
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('ai.provider')}</span>
          <select value={provider} onChange={e => setProvider(e.target.value)} disabled={running}
            className="input-apple" style={{ minWidth: 160 }}>
            <option value="gemini">Gemini (Google)</option>
            <option value="deepseek">DeepSeek</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('ai.scope')}</span>
          <select value={scope} onChange={e => setScope(e.target.value)} disabled={running}
            className="input-apple" style={{ minWidth: 200 }}>
            <option value="last50">{t('ai.scopeLast50')}</option>
            <option value="unanalyzed">{t('ai.scopeUnanalyzed')}</option>
            <option value="others">{t('ai.scopeOthers')}</option>
            <option value="all">{t('ai.scopeAll')}</option>
          </select>
        </label>

        {!running && (
          <button onClick={handleStart} className="btn-primary" style={{ background: 'var(--system-purple)' }}>
            {result ? t('ai.startNew') : t('ai.start')}
          </button>
        )}

        {running && (
          <>
            {!paused ? (
              <button onClick={handlePause} className="btn-secondary" style={{ color: 'var(--system-orange)' }}>
                <Pause className="w-4 h-4" /> {t('ai.pause')}
              </button>
            ) : (
              <button onClick={handleResume} className="btn-primary" style={{ background: 'var(--system-green)' }}>
                <Play className="w-4 h-4" /> {t('ai.resume')}
              </button>
            )}
            <button onClick={handleCancel} className="btn-secondary" style={{ color: 'var(--system-red)' }}>
              <Square className="w-4 h-4" /> {t('ai.cancel')}
            </button>
          </>
        )}
      </div>

      {progress && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
            <span>
              {progress.done !== undefined
                ? t('ai.classified', { done: progress.done, total: progress.total })
                : `${progress.current} / ${progress.total}`}
              {paused && ` · ⏸ ${t('ai.paused')}`}
              {progress.errors > 0 && ` · ${t('ai.errorsN', { n: progress.errors })}`}
            </span>
            <span>{pct}%</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
            <div className="h-full transition-all duration-300 rounded-full"
              style={{ width: `${pct}%`, background: progressColor }} />
          </div>
        </div>
      )}

      {currentItem && (
        <div className="mt-3 rounded p-3"
          style={{ background: 'rgba(88, 86, 214, 0.06)', border: '1px solid rgba(88, 86, 214, 0.15)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--system-purple)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--system-purple)' }}>
              {t('ai.classifying', { index: currentItem.index, total: currentItem.total })}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>· {currentItem.docId}</span>
            {currentItem.hasImages > 0 && (
              <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                · <Image className="w-3 h-3" /> {currentItem.hasImages}
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {currentItem.description || <span className="italic" style={{ color: 'var(--text-tertiary)' }}>{t('ai.noDescription')}</span>}
          </p>
          <div className="flex gap-3 mt-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {currentItem.hazard && <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {currentItem.hazard}</span>}
            {currentItem.submitter && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {currentItem.submitter}</span>}
            {currentItem.area && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {currentItem.area}</span>}
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div className="mt-3 rounded p-3 max-h-80 overflow-y-auto font-mono text-xs"
          style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-subtle)' }}>
          {logs.map((entry, i) => (
            <div key={i}
              style={{
                color: LOG_COLORS[entry.type] || '#6E6E73',
                fontWeight: entry.type === 'header' ? 600 : 400,
                borderBottom: entry.type === 'header' ? '1px solid var(--border-subtle)' : 'none',
                paddingBottom: entry.type === 'header' ? 4 : 0,
                marginBottom: entry.type === 'header' ? 4 : 0,
              }}>
              <span style={{ color: 'var(--text-tertiary)', marginRight: 8 }}>{entry.time}</span>
              {entry.text}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      )}
    </div>
  );
}
