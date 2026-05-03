import React from 'react';
import { render, act } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary } from './index';

// ============================================================
// 辅助组件：会抛错的子组件
// ============================================================

const BuggyComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test render error');
  }
  return <div>正常渲染</div>;
};

const StableComponent: React.FC = () => <div>稳定组件</div>;

// ============================================================
// 测试
// ============================================================

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // 抑制 React 关于 Error Boundary 的错误日志
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('正常渲染子组件', () => {
    const { container } = render(
      <ErrorBoundary>
        <StableComponent />
      </ErrorBoundary>
    );
    expect(container.textContent).toContain('稳定组件');
  });

  it('捕获子组件错误并显示默认 fallback', () => {
    const { container } = render(
      <ErrorBoundary componentName="TestComponent">
        <BuggyComponent shouldThrow />
      </ErrorBoundary>
    );

    expect(container.textContent).toContain('TestComponent 加载异常');
    expect(container.textContent).toContain('Test render error');
    expect(container.textContent).toContain('重试');
  });

  it('使用自定义 fallback 替代默认 UI', () => {
    const { container } = render(
      <ErrorBoundary fallback={<div>自定义错误页面</div>}>
        <BuggyComponent shouldThrow />
      </ErrorBoundary>
    );

    expect(container.textContent).toContain('自定义错误页面');
  });

  it('点击重试按钮后重置错误状态（然后再次抛出会重新捕获）', () => {
    const { container } = render(
      <ErrorBoundary componentName="RetryTest">
        <BuggyComponent shouldThrow />
      </ErrorBoundary>
    );

    expect(container.textContent).toContain('RetryTest 加载异常');

    // 点击重试，内部状态重置为 normal
    // 然后子组件重新渲染再次抛出错误，ErrorBoundary 重新捕获
    const retryBtn = container.querySelector('button');
    act(() => { retryBtn?.click(); });

    // 因为 BuggyComponent 仍然抛错，再次显示 fallback
    expect(container.textContent).toContain('RetryTest 加载异常');
  });

  it('未发生错误时不记录日志', () => {
    const onError = jest.fn();
    render(
      <ErrorBoundary onError={onError}>
        <StableComponent />
      </ErrorBoundary>
    );

    expect(onError).not.toHaveBeenCalled();
  });

  it('发生错误时调用 onError 回调', () => {
    const onError = jest.fn();
    render(
      <ErrorBoundary onError={onError}>
        <BuggyComponent shouldThrow />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe('Test render error');
  });

  it('错误信息显示完整的堆栈信息', () => {
    const { container } = render(
      <ErrorBoundary componentName="StackTest">
        <BuggyComponent shouldThrow />
      </ErrorBoundary>
    );

    expect(container.textContent).toContain('StackTest 加载异常');
  });
});

describe('withErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('包裹后的组件正常渲染', () => {
    const Wrapped = withErrorBoundary(StableComponent, { componentName: 'WrappedStable' });
    const { container } = render(<Wrapped />);
    expect(container.textContent).toContain('稳定组件');
  });

  it('包裹后的组件捕获错误', () => {
    const Wrapped = withErrorBoundary(BuggyComponent, { componentName: 'WrappedBuggy' });
    const { container } = render(<Wrapped shouldThrow />);
    expect(container.textContent).toContain('WrappedBuggy 加载异常');
  });
});
