// ─────────────────────────────────────────────────────────────
// SignInScreen — Strava-style clean dark sign-in form.
// Orange CTA, minimal decoration, Clerk auth.
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
import { useSignIn } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import Input from '../../components/common/Input';
import GradientButton from '../../components/common/GradientButton';
import { useTheme } from '../../contexts/ThemeContext';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type { AuthStackParamList } from '../../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'SignIn'>;
};

export default function SignInScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { signIn, setActive, isLoaded } = useSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!isLoaded) return;
    setError('');
    setLoading(true);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      } else {
        setError('Sign in incomplete. Please try again.');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage ?? 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back */}
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={theme.colors.on_surface} />
            </TouchableOpacity>

            {/* Logo mark */}
            <View style={[styles.logoMark, { backgroundColor: theme.colors.primary }]}>
              <Text style={{ fontSize: 22 }}>⚡</Text>
            </View>

            {/* Header */}
            <Text style={[styles.heading, { color: theme.colors.on_surface }]}>
              Welcome back
            </Text>
            <Text style={[textStyles.bodyLg, styles.subheading, { color: theme.colors.on_surface_variant }]}>
              Sign in to your account
            </Text>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

            {/* Form */}
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
                placeholder="Your password"
                value={password}
                onChangeText={setPassword}
                isPassword
                leftIcon="lock-closed-outline"
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
                error={error}
              />

              <GradientButton
                label="Sign In"
                onPress={handleSignIn}
                loading={loading}
                disabled={!email || !password}
                size="lg"
                style={{ marginTop: spacing[2] }}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[textStyles.bodyMd, { color: theme.colors.on_surface_variant }]}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={[textStyles.bodyMd, { color: theme.colors.primary }]}>
                  Create one
                </Text>
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
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
  },
  backBtn: {
    marginTop: spacing[4],
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[6],
    marginBottom: spacing[5],
  },
  heading: {
    fontSize: 34,
    fontFamily: 'Lexend-Bold',
    letterSpacing: -0.5,
  },
  subheading: {
    marginTop: spacing[1],
  },
  divider: {
    height: 1,
    marginVertical: spacing[7],
    opacity: 0.3,
  },
  form: {
    gap: spacing[4],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[8],
  },
});
