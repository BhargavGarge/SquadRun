// Create a new squad form

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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';

import Input from '../../components/common/Input';
import GradientButton from '../../components/common/GradientButton';
import GlassCard from '../../components/common/GlassCard';
import Chip from '../../components/common/Chip';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthContext } from '../../contexts/AuthContext';
import { useSquadStore } from '../../contexts/SquadContext';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const SQUAD_EMOJIS = ['⚡', '🔥', '💪', '🏆', '🚀', '🎯', '⭐', '🏃'];

export default function CreateSquadScreen() {
  const { theme } = useTheme();
  const { dbUser } = useAuthContext();
  const navigation = useNavigation<any>();
  const { createSquad } = useSquadStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState(6);
  const [emoji, setEmoji] = useState('⚡');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!dbUser || !name.trim()) return;
    setError('');
    setLoading(true);

    try {
      const squad = await createSquad(
        `${emoji} ${name.trim()}`,
        description.trim(),
        dbUser.id
      );
      navigation.replace('SquadDetail', { squadId: squad.id });
    } catch (err: any) {
      setError(err.message ?? 'Failed to create squad. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={theme.colors.on_surface} />
              </TouchableOpacity>
              <Text style={[textStyles.headlineMd, { color: theme.colors.on_surface }]}>
                Create a Squad
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Emoji picker */}
            <View style={styles.section}>
              <Text style={[textStyles.labelMd, { color: theme.colors.on_surface_variant, marginBottom: spacing[3] }]}>
                Choose an Icon
              </Text>
              <View style={styles.emojiGrid}>
                {SQUAD_EMOJIS.map((e) => (
                  <TouchableOpacity
                    key={e}
                    onPress={() => setEmoji(e)}
                    style={[
                      styles.emojiBtn,
                      {
                        backgroundColor:
                          emoji === e
                            ? `${theme.colors.primary}33`
                            : theme.colors.surface_container,
                        borderColor: emoji === e ? theme.colors.primary : 'transparent',
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 28 }}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Form */}
            <View style={styles.section}>
              <Input
                label="Squad Name"
                placeholder="e.g. Morning Warriors"
                value={name}
                onChangeText={setName}
                leftIcon="people-outline"
                maxLength={30}
                error={error}
              />
            </View>

            <View style={styles.section}>
              <Input
                label="Description (optional)"
                placeholder="What's your squad about?"
                value={description}
                onChangeText={setDescription}
                leftIcon="text-outline"
                maxLength={120}
                multiline
                numberOfLines={3}
                style={{ height: 80, paddingTop: 12 }}
              />
            </View>

            {/* Max members slider */}
            <View style={styles.section}>
              <GlassCard padding={spacing[4]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing[3] }}>
                  <Text style={[textStyles.labelMd, { color: theme.colors.on_surface_variant }]}>
                    Max Members
                  </Text>
                  <Text style={[textStyles.headlineSm, { color: theme.colors.primary_light }]}>
                    {maxMembers}
                  </Text>
                </View>
                <Slider
                  minimumValue={3}
                  maximumValue={6}
                  step={1}
                  value={maxMembers}
                  onValueChange={setMaxMembers}
                  minimumTrackTintColor={theme.colors.primary}
                  maximumTrackTintColor={theme.colors.outline}
                  thumbTintColor={theme.colors.primary_light}
                />
                <View style={styles.sliderLabels}>
                  <Text style={[textStyles.bodySm, { color: theme.colors.on_surface_variant }]}>3</Text>
                  <Text style={[textStyles.bodySm, { color: theme.colors.on_surface_variant }]}>6</Text>
                </View>
                <Text style={[textStyles.bodySm, { color: theme.colors.on_surface_variant, marginTop: spacing[2] }]}>
                  Squads work best with 3–6 people for close accountability.
                </Text>
              </GlassCard>
            </View>

            {/* Preview */}
            <View style={styles.section}>
              <GlassCard elevated padding={spacing[4]}>
                <Text style={[textStyles.labelMd, { color: theme.colors.on_surface_variant, marginBottom: spacing[3] }]}>
                  Preview
                </Text>
                <Text style={[textStyles.headlineSm, { color: theme.colors.on_surface }]}>
                  {emoji} {name || 'Squad Name'}
                </Text>
                {description ? (
                  <Text style={[textStyles.bodySm, { color: theme.colors.on_surface_variant, marginTop: 4 }]}>
                    {description}
                  </Text>
                ) : null}
                <Text style={[textStyles.bodySm, { color: theme.colors.on_surface_muted, marginTop: spacing[2] }]}>
                  Up to {maxMembers} members
                </Text>
              </GlassCard>
            </View>

            <View style={styles.section}>
              <GradientButton
                label="Create Squad 🚀"
                onPress={handleCreate}
                loading={loading}
                disabled={!name.trim()}
                size="lg"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: spacing[8] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  section: { paddingHorizontal: spacing[4], marginBottom: spacing[4] },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  emojiBtn: {
    width: 56,
    height: 56,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -spacing[1],
  },
});
