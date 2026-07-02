import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
          <div className="max-w-2xl w-full bg-surface rounded-2xl shadow-soft-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-[32px]">error</span>
            </div>
            <h1 className="font-display-md text-display-md font-bold text-on-surface mb-4">
              Something went wrong
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details className="text-left mb-6 p-4 bg-surface-variant/50 rounded-lg">
                <summary className="font-label-md text-label-md font-semibold text-on-surface cursor-pointer mb-2">
                  Error Details
                </summary>
                <pre className="font-mono text-xs text-on-surface-variant overflow-x-auto whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary px-6 py-3"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                Refresh Page
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null })
                }}
                className="btn-secondary px-6 py-3"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
