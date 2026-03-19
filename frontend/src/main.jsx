import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('🔴 React Error Boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          color: '#f5f5f7',
          fontFamily: 'monospace',
          padding: '2rem',
          gap: '1rem',
        }}>
          <h1 style={{ color: '#FF453A', fontSize: '1.5rem' }}>⚠️ Erro na aplicação</h1>
          <pre style={{
            background: '#1c1c1e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '1.5rem',
            maxWidth: '800px',
            width: '100%',
            overflow: 'auto',
            fontSize: '0.8rem',
            color: '#FF453A',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {this.state.error?.toString()}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '0.75rem 2rem',
              background: '#0A84FF',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
