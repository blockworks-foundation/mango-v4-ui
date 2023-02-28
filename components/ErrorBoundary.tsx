import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children?: ReactNode
}

interface State {
  error: Error | null | undefined
  hasError: boolean
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    error: null,
    hasError: false,
  }

  public static getDerivedStateFromError(e: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: e }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    const error = this.state.error
    if (this.state.hasError) {
      return (
        <div>
          <p>Error. Please refresh</p>
          <div>{`${error}`}</div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
