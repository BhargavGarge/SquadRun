// Join a squad via invite code

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import Input from '../../components/common/Input';
import GradientButton from '../../components/common/GradientButton';
import GlassCard from '../../components/common/GlassCard';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthContext } from '../../contexts/AuthContext';
import { useSquadStore } from '../../contexts/SquadContext';
import { squadsApi } from '../../services/supabase';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type { Squad } from '../../types';

export default function JoinSquadScreen() {
  const { theme } = useTheme();
  const { dbUser } = useAuthContext();
  const navigation = useNavigation<any>();
  const { joinSquad } = useSquadStore();

  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<Squad | null>(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const handleLookup = async () => {
    if (!code.trim()) return;
    setError('');
    setLoading(true);
    setPreview(null);

    try {
      const squad = await squadsApi.getByInviteCode(code.trim());
      setPreview(squad);
    } catch (err) {
      setError('No squad found with that code. Double-check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!preview || !dbUser) return;
    setJoining(true);

    try {
      await joinSquad(code.trim(), dbUser.id);
      navigation.replace('SquadDetail', { squadId: preview.id });
    } catch (err: any) {
      setError(err.message ?? 'Failed to join squad.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={theme.colors.on_surface} />
            </TouchableOpacity>
            <Text style={[textStyles.headlineMd, { color: theme.colors.on_surface }]}>
              Join a Squad
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.content}>
            {/* Hero */}
            <View style={{ alignItems: 'center', marginBottom: spacing[8] }}>
              <Text style={{ fontSize: 56, marginBottom: spacing[4] }}>🤝</Text>
              <Text style={[textStyles.bodyLg, { color: theme.colors.on_surface_variant, textAlign: 'center' }]}>
                Enter a 6-character invite code shared by your squad captain.
              </Text>
            </View>

            {/* Code input */}
            <Input
              label="Invite Code"
              placeholder="ABC123"
              value={code}
              onChangeText={(t) => {
                setCode(t.toUpperCase());
                setPreview(null);
                setError('');
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              leftIcon="key-outline"
              error={error}
              style={{ textAlign: 'center', letterSpacing: 6, fontSize: 22, fontFamily: 'Lexend-Bold' }}
              returnKeyType="search"
              onSubmitEditing={handleLookup}
            />

            <GradientButton
              label="Find Squad"
              onPress={handleLookup}
              loading={loading}
              disabled={code.length < 4}
              variant="secondary"
              style={{ marginTop: spacing[4] }}
            />

            {/* Squad preview */}
            {preview && (
              <GlassCard elevated style={styles.preview}>
                <Text style={[textStyles.labelMd, { color: theme.colors.success }]}>
                  Squad Found ✓
                </Text>
                <Text style={[textStyles.headlineSm, { color: theme.colors.on_surface, marginTop: spacing[1] }]}>
                  {preview.name}
                </Text>
                {preview.description && (
                  <Text style={[textStyles.bodyMd, { color: theme.colors.on_surface_variant, marginTop: 4 }]}>
                    {preview.description}
                  </Text>
                )}
                <Text style={[textStyles.bodySm, { color: theme.colors.on_surface_muted, marginTop: spacing[2] }]}>
                  {preview.member_count ?? '?'} / {preview.max_members} members
                </Text>

                <GradientButton
                  label="Join this Squad! 🚀"
                  onPress={handleJoin}
                  loading={joining}
                  style={{ marginTop: spacing[4] }}
                />
              </GlassCard>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
  },
  preview: {
    marginTop: spacing[6],
    gap: 0,
  },
});
