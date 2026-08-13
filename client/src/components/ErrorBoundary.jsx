import { Component } from 'react';
import { useLanguage } from '../context/LanguageContext';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--bg-primary)' }}>
          <div className="card max-w-lg w-full text-center">
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--system-red)' }}>
              {this.props.t('errorBoundary.title')}
            </h2>
            <p className="text-sm mb-4 font-mono break-all" style={{ color: 'var(--text-secondary)' }}>
              {this.state.error.message || String(this.state.error)}
            </p>
            <button
              onClick={() => { this.setState({ error: null }); window.location.reload(); }}
              className="btn-primary"
            >
              {this.props.t('errorBoundary.reload')}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ErrorBoundaryWithI18n(props) {
  const { t } = useLanguage();
  return <ErrorBoundary {...props} t={t} />;
}
