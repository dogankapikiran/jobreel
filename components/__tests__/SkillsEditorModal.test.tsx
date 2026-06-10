import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SkillsEditorModal from '../profile/SkillsEditorModal';

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

describe('SkillsEditorModal', () => {
  const defaultProps = {
    visible: true,
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
    insets: { bottom: 0 },
    initialSkills: ['React', 'TypeScript'],
    suggestedSkills: ['React', 'TypeScript', 'Node.js', 'React Native'],
    onSave: jest.fn().mockResolvedValue(undefined),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with skills list', () => {
    const { getByText, getByPlaceholderText } = render(
      <SkillsEditorModal {...defaultProps} />
    );

    expect(getByText('Yetenekler')).toBeTruthy();
    expect(getByPlaceholderText('Yetenek ekle...')).toBeTruthy();
    expect(getByText('React')).toBeTruthy();
    expect(getByText('TypeScript')).toBeTruthy();
    expect(getByText('Node.js')).toBeTruthy();
  });

  it('allows adding a custom skill', () => {
    const { getByPlaceholderText, getByText } = render(
      <SkillsEditorModal {...defaultProps} />
    );

    const input = getByPlaceholderText('Yetenek ekle...');
    const addButton = getByText('+');

    fireEvent.changeText(input, 'GraphQL');
    fireEvent.press(addButton);

    // Save button should reflect updated skill count
    expect(getByText('Kaydet (3 yetenek)')).toBeTruthy();
  });

  it('calls onSave when save button is pressed', () => {
    const { getByText } = render(
      <SkillsEditorModal {...defaultProps} />
    );

    const saveBtn = getByText('Kaydet (2 yetenek)');
    fireEvent.press(saveBtn);

    expect(defaultProps.onSave).toHaveBeenCalledWith(['React', 'TypeScript']);
  });
});
