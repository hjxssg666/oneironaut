import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: '' };

  static getDerivedStateFromError(e: Error): State {
    return { hasError: true, error: e.message };
  }

  componentDidCatch(e: Error) {
    console.error('[梦海错误]', e);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--ink-900)',
            color: 'var(--fg-100)',
            fontFamily: 'var(--font-dream)',
            gap: 24,
            zIndex: 9999,
          }}
        >
          <h1 style={{ color: 'var(--gold-500)', fontSize: 'var(--text-display-md)' }}>梦海 · 微澜</h1>
          <p style={{ color: 'var(--muted-100)', fontSize: 'var(--text-body-lg)' }}>
            星海泛起一阵涟漪，片刻便会平静。
          </p>
          <p style={{ color: 'var(--muted-100)', fontSize: 'var(--text-body-sm)', opacity: 0.8 }}>
            {this.state.error}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
            style={{ fontFamily: 'var(--font-dream)', fontSize: 'var(--text-body-md)' }}
          >
            重新入梦
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
