// Notifications screen — lists app notifications with mark-read

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

import GlassCard from '../../components/common/GlassCard';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthContext } from '../../contexts/AuthContext';
import { notificationsApi } from '../../services/supabase';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type { AppNotification } from '../../types';

const KIND_CONFIG: Record<string, { emoji: string; color: string }> = {
  workout_logged: { emoji: '💪', color: '#10B981' },
  goal_achieved: { emoji: '🏆', color: '#F59E0B' },
  streak_at_risk: { emoji: '⚠️', color: '#EF4444' },
  member_joined: { emoji: '👋', color: '#8B5CF6' },
  squad_invite: { emoji: '📧', color: '#06B6D4' },
  milestone: { emoji: '⭐', color: '#F59E0B' },
};

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const { dbUser } = useAuthContext();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (dbUser) loadNotifications();
  }, [dbUser?.id]);

  const loadNotifications = async () => {
    if (!dbUser) return;
    try {
      const data = await notificationsApi.getByUser(dbUser.id);
      setNotifications(data);
    } catch (err) {
      console.error('[Notifications] load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (!dbUser) return;
    await notificationsApi.markAllRead(dbUser.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleMarkRead = async (id: string) => {
    await notificationsApi.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderItem = ({ item }: { item: AppNotification }) => {
    const config = KIND_CONFIG[item.kind] ?? { emoji: '🔔', color: theme.colors.primary };
    return (
      <TouchableOpacity onPress={() => handleMarkRead(item.id)} activeOpacity={0.7}>
        <View
          style={[
            styles.notifRow,
            !item.read && { backgroundColor: `${config.color}0A` },
          ]}
        >
          <View style={[styles.notifIcon, { backgroundColor: `${config.color}22` }]}>
            <Text style={{ fontSize: 20 }}>{config.emoji}</Text>
          </View>
          <View style={styles.notifContent}>
            <Text
              style={[
                textStyles.titleMd,
                { color: item.read ? theme.colors.on_surface_variant : theme.colors.on_surface },
              ]}
            >
              {item.title}
            </Text>
            <Text style={[textStyles.bodyMd, { color: theme.colors.on_surface_variant, marginTop: 2 }]}>
              {item.body}
            </Text>
            <Text style={[textStyles.labelSm, { color: theme.colors.on_surface_muted, marginTop: 4 }]}>
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </Text>
          </View>
          {!item.read && (
            <View style={[styles.unreadDot, { backgroundColor: config.color }]} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={[textStyles.headlineLg, { color: theme.colors.on_surface }]}>
            Notifications
            {unreadCount > 0 && (
              <Text style={{ color: theme.colors.primary_light }}> {unreadCount}</Text>
            )}
          </Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead}>
              <Text style={[textStyles.bodyMd, { color: theme.colors.primary_light }]}>
                Mark all read
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, notifications.length === 0 && styles.emptyContainer]}
          ItemSeparatorComponent={() => (
            <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Text style={{ fontSize: 48, marginBottom: spacing[4] }}>🔕</Text>
                <Text style={[textStyles.headlineSm, { color: theme.colors.on_surface, textAlign: 'center' }]}>
                  All caught up!
                </Text>
                <Text style={[textStyles.bodyMd, { color: theme.colors.on_surface_variant, textAlign: 'center', marginTop: spacing[2] }]}>
                  Squad activity will show up here
                </Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  list: { paddingBottom: spacing[20] },
  emptyContainer: { flex: 1 },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    gap: spacing[3],
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifContent: { flex: 1 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: spacing[2],
    flexShrink: 0,
  },
  divider: { height: 1, opacity: 0.3, marginHorizontal: spacing[4] },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing[20] },
});
