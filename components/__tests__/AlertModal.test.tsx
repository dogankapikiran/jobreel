import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AlertModal from '../alert/AlertModal';

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

describe('AlertModal', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    editingAlert: null,
    onSubmit: jest.fn().mockResolvedValue(undefined),
    sectorOptions: ['Software', 'Design'],
    defaultLocation: 'Istanbul',
    colors: {
      bg: '#ffffff',
      bgDeep: '#f0f0f0',
      cardBg: '#ffffff',
      cardBorder: '#e0e0e0',
      text: '#000000',
      textMuted: '#666666',
      textDim: '#888888',
      accent: '#0066cc',
      isDark: false,
    } as any,
    insets: { top: 0, bottom: 0 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly for creating a new alert', () => {
    const { getByText, getByPlaceholderText } = render(
      <AlertModal {...defaultProps} />
    );

    expect(getByText('Yeni Alarm')).toBeTruthy();
    expect(getByPlaceholderText('örn. React Native, Product Manager')).toBeTruthy();
    expect(getByText('Alarm Kur')).toBeTruthy();
  });

  it('populates fields correctly when editing an alert', () => {
    const editingAlert = {
      id: 'alert123',
      keyword: 'Product Manager',
      location: 'Ankara',
      work_type: 'hybrid',
      seniority: ['senior'],
      sectors: ['Software'],
      enabled: true,
      label: 'pm',
    };

    const { getByText, getByDisplayValue } = render(
      <AlertModal {...defaultProps} editingAlert={editingAlert} />
    );

    expect(getByText('Alarmı Düzenle')).toBeTruthy();
    expect(getByDisplayValue('Product Manager')).toBeTruthy();
    expect(getByText('Kaydet')).toBeTruthy();
  });

  it('calls onSubmit on form submission', () => {
    const { getByText, getByPlaceholderText } = render(
      <AlertModal {...defaultProps} />
    );

    const input = getByPlaceholderText('örn. React Native, Product Manager');
    fireEvent.changeText(input, 'React Developer');

    const submitBtn = getByText('Alarm Kur');
    fireEvent.press(submitBtn);

    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });
});
