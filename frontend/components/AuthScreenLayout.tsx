import React from 'react';
import { Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthAnimations } from '../hooks/useAuthAnimations';

type AuthScreenLayoutProps = {
  title: string;
  subtitle: string;
  message?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  iconName?: React.ComponentProps<typeof MaterialIcons>['name'];
  iconColor?: string;
};

export default function AuthScreenLayout({
  title,
  subtitle,
  message,
  footer,
  children,
  iconName = 'sports-soccer',
  iconColor = '#4be277',
}: AuthScreenLayoutProps) {
  const { fadeAnim, slideAnim, pulseAnim, bgScaleAnim } = useAuthAnimations();

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />

      <View style={StyleSheet.absoluteFill}>
        <Animated.Image
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNgBJlBY97_QaewYW2r-DjSlc7y1DcxBuTyd2FT01aWpOMDdC6E5Ojftib57g020fqnyp0_maN4R5MEHbvA5mKvbvL62-rTz8r9ur1HeYAdQRNcHj2N8UkRNLsr6n30pKT8wvR2ALUnlrVoH30n83mprQd7LqD0c88IYJTTyGNiDVyADu8naOoqsrI2DdszdWsC6qGeg9DMNEPKErslJTkraaMEw-PLU4zYb0RM7Qzcqh4FeFxhc1IHMBcbbO-zGz4b_LtpTKBW06d' }}
          style={[styles.bgImage, { transform: [{ scale: bgScaleAnim }] }]}
          resizeMode="cover"
        />
        <View style={styles.overlay} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.responsiveWrapper}>
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 12, shadowColor: iconColor, shadowOpacity: 0.6, shadowRadius: 20, elevation: 15 }}>
              <MaterialIcons name={iconName} size={72} color={iconColor} />
            </Animated.View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </Animated.View>

          <Animated.View style={[styles.glassCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {message}
            {children}
          </Animated.View>

          {footer ? (
            <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
              {footer}
            </Animated.View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
  },
  bgImage: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 56,
    fontWeight: '900',
    color: '#4be277',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadowColor: 'rgba(75, 226, 119, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#bccbb9',
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  glassCard: {
    backgroundColor: 'rgba(30,30,30,0.7)',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
});
