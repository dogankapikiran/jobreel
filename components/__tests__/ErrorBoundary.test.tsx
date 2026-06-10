import React from 'react';
import { render } from '@testing-library/react-native';
import ErrorBoundary from '../ErrorBoundary';
import { api } from '@/services/api';

jest.mock('@/services/api', () => ({
  api: {
    logError: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    bg: '#ffffff',
    bgDeep: '#f0f0f0',
    cardBg: '#ffffff',
    cardBorder: '#e0e0e0',
    text: '#000000',
    textMuted: '#666666',
    textDim: '#888888',
    accent: '#0066cc',
    isDark: false,
  }),
}));

const BuggyComponent = () => {
  throw new Error('Test Buggy Component Error');
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Prevent console.error from polluting test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if ((console.error as any).mockRestore) {
      (console.error as any).mockRestore();
    }
  });

  it('renders children when no error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <TextWrapper>No Error Component</TextWrapper>
      </ErrorBoundary>
    );
    expect(getByText('No Error Component')).toBeTruthy();
  });

  it('catches error and displays fallback UI', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>
    );

    expect(getByText('Bir Hata Oluştu')).toBeTruthy();
    expect(getByText('Test Buggy Component Error')).toBeTruthy();
    expect(api.logError).toHaveBeenCalledWith(
      'Test Buggy Component Error',
      expect.any(String),
      { platform: 'native' }
    );
  });
});

// Simple helper component to avoid bare string rendering issue
import { Text } from 'react-native';
function TextWrapper({ children }: { children: string }) {
  return <Text>{children}</Text>;
}
