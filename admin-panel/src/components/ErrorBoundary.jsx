import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Admin panel error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary" style={{ padding: '2rem', maxWidth: 720 }}>
          <h2 style={{ marginBottom: '0.75rem' }}>Something went wrong</h2>
          <p style={{ color: '#64748b', marginBottom: '1rem' }}>
            The admin panel hit an error. Check the browser console for details.
          </p>
          <pre
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: '1rem',
              overflow: 'auto',
              fontSize: '0.85rem',
              color: '#991b1b',
            }}
          >
            {this.state.error?.message || String(this.state.error)}
          </pre>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
