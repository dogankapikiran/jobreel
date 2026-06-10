import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AuthScreen from '../auth';
import { useAuthForm } from '@/hooks/useAuthForm';

jest.mock('@/hooks/useAuthForm', () => ({
  useAuthForm: jest.fn(),
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

jest.mock('@/store/guestStore', () => ({
  useGuestStore: {
    getState: () => ({
      setGuest: jest.fn(),
    }),
  },
}));

describe('AuthScreen', () => {
  const mockUseAuthForm = useAuthForm as jest.Mock;

  const defaultMockValues = {
    mode: 'signin',
    email: '',
    setEmail: jest.fn(),
    password: '',
    setPassword: jest.fn(),
    confirmPassword: '',
    setConfirmPassword: jest.fn(),
    busy: false,
    forgotSent: false,
    forgotError: '',
    signupSent: false,
    focusedField: null,
    setFocusedField: jest.fn(),
    validationError: '',
    error: '',
    switchMode: jest.fn(),
    submit: jest.fn(),
    handleAppleSignIn: jest.fn(),
    handleGoogleSignIn: jest.fn(),
    sendForgot: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    mockUseAuthForm.mockReturnValue(defaultMockValues);

    const { getByText, getAllByText, getByPlaceholderText } = render(<AuthScreen />);

    expect(getByText('JobReel')).toBeTruthy();
    expect(getByPlaceholderText('✉  E-posta')).toBeTruthy();
    expect(getByPlaceholderText('🔒  Şifre')).toBeTruthy();
    expect(getAllByText('Giriş Yap').length).toBeGreaterThan(0);
    expect(getByText('G  Google ile Devam Et')).toBeTruthy();
  });

  it('renders sign up form correctly when mode is signup', () => {
    mockUseAuthForm.mockReturnValue({
      ...defaultMockValues,
      mode: 'signup',
    });

    const { getByText, getAllByText, getByPlaceholderText } = render(<AuthScreen />);

    expect(getByPlaceholderText('🔒  Şifre Tekrar')).toBeTruthy();
    expect(getAllByText('Kayıt Ol').length).toBeGreaterThan(0);
  });

  it('renders forgot password screen when mode is forgot', () => {
    mockUseAuthForm.mockReturnValue({
      ...defaultMockValues,
      mode: 'forgot',
    });

    const { getByText, getByPlaceholderText } = render(<AuthScreen />);

    expect(getByText('Şifre Sıfırlama')).toBeTruthy();
    expect(getByPlaceholderText('E-posta')).toBeTruthy();
    expect(getByText('Bağlantı Gönder')).toBeTruthy();
  });

  it('triggers submit on primary button press', () => {
    const submitMock = jest.fn();
    mockUseAuthForm.mockReturnValue({
      ...defaultMockValues,
      submit: submitMock,
    });

    const { getAllByText } = render(<AuthScreen />);
    // Select the submit button (usually the second element or we can press either)
    const loginBtn = getAllByText('Giriş Yap')[1] || getAllByText('Giriş Yap')[0];
    fireEvent.press(loginBtn);

    expect(submitMock).toHaveBeenCalled();
  });
});
