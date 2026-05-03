import React, { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** 组件名称，用于日志标识 */
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * 通用的 React Error Boundary 组件。
 *
 * 捕获子组件的渲染错误，防止整个应用崩溃。
 * 提供可自定义的回退 UI 和错误回调。
 *
 * @example
 * ```tsx
 * <ErrorBoundary componentName="TaskList" fallback={<p>加载失败</p>}>
 *   <TaskList />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const name = this.props.componentName || 'Unknown';
    console.error(`[ErrorBoundary:${name}]`, error.message, errorInfo.componentStack);
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: '24px',
            margin: '16px 0',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
            border: '1px solid #fecaca',
            textAlign: 'center' as const,
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
          <h3 style={{ margin: '0 0 8px', color: '#e11d48', fontSize: '16px', fontWeight: 600 }}>
            {this.props.componentName || '组件'} 加载异常
          </h3>
          <p style={{ margin: '0 0 16px', color: '#be123c', fontSize: '13px' }}>
            {this.state.error?.message || '发生了意外的渲染错误'}
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '8px 20px',
              borderRadius: '24px',
              border: 'none',
              background: '#e11d48',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 高阶组件：用 ErrorBoundary 包裹组件。
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const displayName = options?.componentName || Component.displayName || Component.name || 'Component';

  const Wrapped: React.FC<P> = (props) => (
    <ErrorBoundary {...options} componentName={displayName}>
      <Component {...props} />
    </ErrorBoundary>
  );

  Wrapped.displayName = `withErrorBoundary(${displayName})`;
  return Wrapped;
}
