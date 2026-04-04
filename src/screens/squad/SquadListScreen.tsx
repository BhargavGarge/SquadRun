// Squad list — shows all squads the user belongs to

import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  StatusBar,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import GlassCard from "../../components/common/GlassCard";
import GradientButton from "../../components/common/GradientButton";
import ProgressRing from "../../components/common/ProgressRing";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuthContext } from "../../contexts/AuthContext";
import { useSquadStore } from "../../contexts/SquadContext";
import { textStyles } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import type { Squad } from "../../types";

export default function SquadListScreen() {
  const { theme } = useTheme();
  const { dbUser } = useAuthContext();
  const navigation = useNavigation<any>();
  const { squads, squadsLoading, loadSquads, selectSquad } = useSquadStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (dbUser) loadSquads(dbUser.id);
  }, [dbUser?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (dbUser) await loadSquads(dbUser.id);
    setRefreshing(false);
  }, [dbUser]);

  const handleSquadPress = async (squad: Squad) => {
    await selectSquad(squad);
    navigation.navigate("SquadDetail", { squadId: squad.id });
  };

  const renderSquad = ({ item }: { item: Squad }) => (
    <SquadListCard squad={item} onPress={() => handleSquadPress(item)} />
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text
            style={[textStyles.headlineLg, { color: theme.colors.on_surface }]}
          >
            My Squads
          </Text>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => navigation.navigate("JoinSquad")}
              style={[
                styles.iconBtn,
                { backgroundColor: theme.colors.surface_container_high },
              ]}
            >
              <Ionicons
                name="enter-outline"
                size={20}
                color={theme.colors.on_surface}
              />
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate("CreateSquad")}
              style={[
                styles.iconBtn,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Ionicons name="add" size={20} color={theme.colors.on_primary} />
            </Pressable>
          </View>
        </View>

        <FlatList
          data={squads}
          renderItem={renderSquad}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || squadsLoading}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary_light}
            />
          }
          ListEmptyComponent={
            !squadsLoading ? (
              <View style={styles.empty}>
                <Text
                  style={{
                    fontSize: 48,
                    textAlign: "center",
                    marginBottom: spacing[4],
                  }}
                >
                  👥
                </Text>
                <Text
                  style={[
                    textStyles.headlineSm,
                    { color: theme.colors.on_surface, textAlign: "center" },
                  ]}
                >
                  No squads yet
                </Text>
                <Text
                  style={[
                    textStyles.bodyMd,
                    {
                      color: theme.colors.on_surface_variant,
                      textAlign: "center",
                      marginTop: spacing[2],
                      marginBottom: spacing[6],
                    },
                  ]}
                >
                  Create a squad and invite friends to get started
                </Text>
                <GradientButton
                  label="Create a Squad"
                  onPress={() => navigation.navigate("CreateSquad")}
                  fullWidth={false}
                  size="md"
                />
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </View>
  );
}

interface SquadListCardProps {
  squad: Squad;
  onPress: () => void;
}

function SquadListCard({ squad, onPress }: SquadListCardProps) {
  const { theme } = useTheme();
  const members = squad.members ?? [];
  const goal = squad.active_goal;
  const progress = goal?.progress_percent ?? 0;

  return (
    <GlassCard
      onPress={onPress}
      elevated
      padding={spacing[4]}
      style={styles.card}
    >
      <View style={styles.cardHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text
            style={[textStyles.headlineSm, { color: theme.colors.on_surface }]}
          >
            {squad.name}
          </Text>
          {squad.description ? (
            <Text
              style={[
                textStyles.bodySm,
                { color: theme.colors.on_surface_variant, marginTop: 2 },
              ]}
              numberOfLines={1}
            >
              {squad.description}
            </Text>
          ) : null}
          <Text
            style={[
              textStyles.bodySm,
              { color: theme.colors.on_surface_muted, marginTop: 4 },
            ]}
          >
            {members.length}/{squad.max_members} members
          </Text>
        </View>

        <ProgressRing
          progress={progress}
          size={72}
          strokeWidth={8}
          showLabel
          label={`${Math.round(progress)}%`}
          sublabel={goal ? "Goal" : "No goal"}
        />
      </View>

      {goal ? (
        <View style={styles.cardGoalRow}>
          <View
            style={[
              styles.goalPill,
              { backgroundColor: `${theme.colors.primary}12` },
            ]}
          >
            <Text
              style={[
                textStyles.labelSm,
                { color: theme.colors.primary_light },
              ]}
              numberOfLines={1}
            >
              {goal.title}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.cardGoalRow}>
          <Text
            style={[
              textStyles.bodySm,
              { color: theme.colors.on_surface_variant },
            ]}
          >
            No active goal — tap to create one
          </Text>
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing[2],
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[20],
  },
  card: {
    borderRadius: 20,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[4],
  },
  cardGoalRow: {
    marginTop: spacing[3],
  },
  goalPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: 999,
  },
  empty: {
    alignItems: "center",
    paddingTop: spacing[16],
    paddingHorizontal: spacing[8],
  },
});
