import React, { Component, ComponentProps, ErrorInfo, ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/services/api';
import { FONT_SIZES, RADII, SPACING } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';

interface Props {
  children: ReactNode;
  colors: ThemeColors;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isSending: boolean;
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isSending: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.reportError(error, errorInfo);
  }

  async reportError(error: Error, errorInfo: ErrorInfo) {
    this.setState({ isSending: true });
    try {
      await api.logError(
        error.message || 'Unknown Error',
        error.stack || errorInfo.componentStack || '',
        { platform: 'native' }
      );
    } catch {
      // Fail silently for logger error
    } finally {
      this.setState({ isSending: false });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isSending: false,
    });
  };

  handleRestart = async () => {
    try {
      await Updates.reloadAsync();
    } catch {
      this.handleReset();
    }
  };

  handleCopy = () => {
    const { error, errorInfo } = this.state;
    const log = `Error: ${error?.message}\nStack:\n${error?.stack}\nComponent Stack:\n${errorInfo?.componentStack}`;
    Clipboard.setString(log);
    Alert.alert('Kopyalandı', 'Hata günlükleri panoya kopyalandı.');
  };

  render() {
    if (this.state.hasError) {
      const { colors } = this.props;
      const s = makeStyles(colors);
      const isDark = colors.isDark;

      return (
        <View style={s.screen}>
          <View style={s.container}>
            <View style={s.iconContainer}>
              <Ionicons name="warning-outline" size={48} color="#ef4444" />
            </View>

            <Text style={s.title}>Bir Hata Oluştu</Text>
            <Text style={s.desc}>
              Uygulamada beklenmedik bir hata oluştu. Hata raporu geliştiricilerimize otomatik olarak iletildi.
            </Text>

            <View style={s.errorBlock}>
              <Text style={s.errorHeader}>HATA DETAYI</Text>
              <ScrollView style={s.errorScroll} showsVerticalScrollIndicator>
                <Text style={s.errorText}>
                  {this.state.error?.message || 'Bilinmeyen Hata'}
                </Text>
                {this.state.error?.stack && (
                  <Text style={s.stackText}>{this.state.error.stack}</Text>
                )}
              </ScrollView>
            </View>

            <View style={s.actions}>
              <TouchableOpacity style={s.copyBtn} onPress={this.handleCopy} activeOpacity={0.7}>
                <Ionicons name="copy-outline" size={16} color={colors.textMuted} />
                <Text style={s.copyBtnText}>Detayları Kopyala</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.primaryBtn} onPress={this.handleRestart} activeOpacity={0.85}>
                <Ionicons name="refresh-outline" size={18} color="#ffffff" />
                <Text style={s.primaryBtnText}>Yeniden Başlat</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.secondaryBtn} onPress={this.handleReset} activeOpacity={0.7}>
                <Text style={s.secondaryBtnText}>Devam Etmeyi Dene</Text>
              </TouchableOpacity>
            </View>

            {this.state.isSending && (
              <View style={s.statusRow}>
                <ActivityIndicator size="small" color={colors.textDim} />
                <Text style={s.statusText}>Hata raporu gönderiliyor...</Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function ErrorBoundary({ children }: { children: ReactNode }) {
  const colors = useTheme();
  return <ErrorBoundaryClass children={children} colors={colors} />;
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.bg,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.xl,
    },
    container: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: c.bgDeep,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: RADII.xl,
      padding: SPACING.xl,
      alignItems: 'center',
      gap: SPACING.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: c.isDark ? 0.35 : 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(239,68,68,0.08)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      color: c.text,
      fontSize: FONT_SIZES.xl,
      fontWeight: '800',
      letterSpacing: -0.5,
      textAlign: 'center',
    },
    desc: {
      color: c.textMuted,
      fontSize: FONT_SIZES.sm,
      lineHeight: 20,
      textAlign: 'center',
      paddingHorizontal: SPACING.sm,
    },
    errorBlock: {
      width: '100%',
      height: 120,
      backgroundColor: c.cardBg,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: RADII.md,
      padding: SPACING.md,
      gap: SPACING.xs,
    },
    errorHeader: {
      color: c.textDim,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.8,
    },
    errorScroll: {
      flex: 1,
    },
    errorText: {
      color: '#ef4444',
      fontSize: FONT_SIZES.xs + 1,
      fontWeight: '600',
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    stackText: {
      color: c.textMuted,
      fontSize: 10,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      marginTop: 4,
    },
    actions: {
      width: '100%',
      gap: SPACING.sm,
      marginTop: SPACING.sm,
    },
    primaryBtn: {
      width: '100%',
      height: 52,
      backgroundColor: c.isDark ? 'rgba(226,232,245,0.15)' : c.accent,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: 'rgba(226,232,245,0.30)',
      borderRadius: RADII.full,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.xs,
      shadowColor: '#051650',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: c.isDark ? 0 : 0.22,
      shadowRadius: 8,
      elevation: 2,
    },
    primaryBtnText: {
      color: '#ffffff',
      fontSize: FONT_SIZES.md,
      fontWeight: '800',
    },
    secondaryBtn: {
      width: '100%',
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryBtnText: {
      color: c.textDim,
      fontSize: FONT_SIZES.sm,
      fontWeight: '600',
    },
    copyBtn: {
      width: '100%',
      height: 44,
      borderRadius: RADII.full,
      borderWidth: 1,
      borderColor: c.cardBorder,
      backgroundColor: c.bg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.xs,
    },
    copyBtnText: {
      color: c.textMuted,
      fontSize: FONT_SIZES.xs,
      fontWeight: '600',
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
      marginTop: SPACING.xs,
    },
    statusText: {
      color: c.textDim,
      fontSize: FONT_SIZES.xs,
    },
  });
}
