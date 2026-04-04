// ─────────────────────────────────────────────────────────────
// SignUpScreen — Strava-style dark sign-up form.
// Step 1: Name / Email / Password. Step 2: Email verification.
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignUp } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import Input from '../../components/common/Input';
import GradientButton from '../../components/common/GradientButton';
import { useTheme } from '../../contexts/ThemeContext';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type { AuthStackParamList } from '../../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;
};

type Step = 'form' | 'verify';

export default function SignUpScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { signUp, setActive, isLoaded } = useSignUp();

  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!isLoaded) return;
    setError('');
    setLoading(true);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('verify');
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage ?? 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded) return;
    setError('');
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        // AppNavigator will auto-route to Onboarding via onboardingComplete = false
        await setActive({ session: result.createdSessionId });
      } else {
        setError('Verification incomplete. Check the code and try again.');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage ?? 'Invalid code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back */}
            <TouchableOpacity
              onPress={() => (step === 'verify' ? setStep('form') : navigation.goBack())}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={22} color={theme.colors.on_surface} />
            </TouchableOpacity>

            {step === 'form' ? (
              <>
                {/* Logo */}
                <View style={[styles.logoMark, { backgroundColor: theme.colors.primary }]}>
                  <Text style={{ fontSize: 22 }}>⚡</Text>
                </View>

                <Text style={[styles.heading, { color: theme.colors.on_surface }]}>
                  Create account
                </Text>
                <Text style={[textStyles.bodyLg, styles.subheading, { color: theme.colors.on_surface_variant }]}>
                  Join thousands of athletes already on Squad Goals
                </Text>

                <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

                <View style={styles.form}>
                  <Input
                    label="Email"
                    placeholder="you@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    leftIcon="mail-outline"
                    returnKeyType="next"
                  />
                  <Input
                    label="Password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChangeText={setPassword}
                    isPassword
                    leftIcon="lock-closed-outline"
                    returnKeyType="done"
                    onSubmitEditing={handleSignUp}
                    error={error}
                    hint="Use 8+ characters with letters and numbers"
                  />

                  <GradientButton
                    label="Create Account"
                    onPress={handleSignUp}
                    loading={loading}
                    disabled={!email || password.length < 8}
                    size="lg"
                    style={{ marginTop: spacing[2] }}
                  />
                </View>
              </>
            ) : (
              <>
                {/* Verification step */}
                <View style={styles.verifyHeader}>
                  <View style={[styles.verifyIcon, { backgroundColor: `${theme.colors.primary}22` }]}>
                    <Ionicons name="mail-outline" size={32} color={theme.colors.primary} />
                  </View>
                  <Text style={[styles.heading, { color: theme.colors.on_surface, textAlign: 'center' }]}>
                    Check your inbox
                  </Text>
                  <Text style={[textStyles.bodyLg, { color: theme.colors.on_surface_variant, textAlign: 'center', marginTop: spacing[2] }]}>
                    We sent a 6-digit code to{'\n'}
                    <Text style={{ color: theme.colors.on_surface }}>{email}</Text>
                  </Text>
                </View>

                <View style={styles.form}>
                  <Input
                    label="Verification Code"
                    placeholder="000000"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    leftIcon="shield-checkmark-outline"
                    maxLength={6}
                    error={error}
                    returnKeyType="done"
                    onSubmitEditing={handleVerify}
                    style={{ textAlign: 'center', letterSpacing: 10, fontSize: 22 }}
                  />

                  <GradientButton
                    label="Verify Email"
                    onPress={handleVerify}
                    loading={loading}
                    disabled={code.length < 6}
                    size="lg"
                    style={{ marginTop: spacing[2] }}
                  />
                </View>
              </>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[textStyles.bodyMd, { color: theme.colors.on_surface_variant }]}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                <Text style={[textStyles.bodyMd, { color: theme.colors.primary }]}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing[6], paddingBottom: spacing[8] },
  backBtn: { marginTop: spacing[4], width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[6],
    marginBottom: spacing[5],
  },
  heading: {
    fontSize: 34,
    fontFamily: 'Lexend_700Bold',
    letterSpacing: -0.5,
  },
  subheading: { marginTop: spacing[1] },
  divider: { height: 1, marginVertical: spacing[7], opacity: 0.3 },
  form: { gap: spacing[4] },
  verifyHeader: { alignItems: 'center', marginTop: spacing[8], marginBottom: spacing[8] },
  verifyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[5],
  },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing[8] },
});
