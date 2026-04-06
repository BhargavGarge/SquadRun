// ─────────────────────────────────────────────────────────────
// Activity feed filtering UI
// Filters: type, date range, buddy
// ─────────────────────────────────────────────────────────────

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { textStyles } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import GlassCard from "../common/GlassCard";
import { Ionicons } from "@expo/vector-icons";

export interface ActivityFilters {
  types: Set<string>;
  dateRange?: { startDate: Date; endDate: Date };
  buddy?: string;
}

interface ActivityFilterButtonProps {
  activeFiltersCount: number;
  onPress: () => void;
}

export function ActivityFilterButton({
  activeFiltersCount,
  onPress,
}: ActivityFilterButtonProps) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.filterBtn,
        {
          backgroundColor:
            activeFiltersCount > 0
              ? theme.colors.primary
              : theme.colors.surface_container,
        },
      ]}
    >
      <Ionicons
        name="funnel"
        size={18}
        color={activeFiltersCount > 0 ? "#fff" : theme.colors.on_surface}
      />
      {activeFiltersCount > 0 && (
        <View
          style={[styles.badgeCount, { backgroundColor: theme.colors.error }]}
        >
          <Text style={[textStyles.labelSm, { color: "#fff" }]}>
            {activeFiltersCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

interface ActivityFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: ActivityFilters;
  onFiltersChange: (filters: ActivityFilters) => void;
}

const WORKOUT_TYPES = [
  "run",
  "cycle",
  "swim",
  "strength",
  "yoga",
  "hike",
  "other",
];
const TYPE_LABELS: Record<string, string> = {
  run: "🏃 Running",
  cycle: "🚴 Cycling",
  swim: "🏊 Swimming",
  strength: "💪 Strength",
  yoga: "🧘 Yoga",
  hike: "🥾 Hiking",
  other: "⚡ Other",
};

export function ActivityFilterModal({
  visible,
  onClose,
  filters,
  onFiltersChange,
}: ActivityFilterModalProps) {
  const { theme } = useTheme();

  const toggleType = (type: string) => {
    const newTypes = new Set(filters.types);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    onFiltersChange({ ...filters, types: newTypes });
  };

  const resetFilters = () => {
    onFiltersChange({
      types: new Set(),
      dateRange: undefined,
      buddy: undefined,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={[
          styles.modalOverlay,
          { backgroundColor: `${theme.colors.background}E6` },
        ]}
      >
        <View
          style={[
            styles.modalContent,
            { backgroundColor: theme.colors.surface_container_high },
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text
              style={[
                textStyles.headlineMd,
                { color: theme.colors.on_surface },
              ]}
            >
              Filter Activity
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons
                name="close"
                size={24}
                color={theme.colors.on_surface}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{
              gap: spacing[4],
              paddingVertical: spacing[4],
            }}
          >
            {/* Workout Types */}
            <View style={{ paddingHorizontal: spacing[4] }}>
              <Text
                style={[
                  textStyles.labelMd,
                  {
                    color: theme.colors.on_surface_variant,
                    marginBottom: spacing[2],
                  },
                ]}
              >
                WORKOUT TYPE
              </Text>
              <View style={{ gap: spacing[2] }}>
                {WORKOUT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => toggleType(type)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: filters.types.has(type)
                          ? `${theme.colors.primary}20`
                          : theme.colors.surface_container,
                        borderColor: filters.types.has(type)
                          ? theme.colors.primary
                          : theme.colors.outline,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        textStyles.bodyMd,
                        {
                          color: filters.types.has(type)
                            ? theme.colors.primary
                            : theme.colors.on_surface,
                        },
                      ]}
                    >
                      {TYPE_LABELS[type]}
                    </Text>
                    {filters.types.has(type) && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={theme.colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Reset Button */}
            {(filters.types.size > 0 || filters.dateRange || filters.buddy) && (
              <TouchableOpacity
                onPress={resetFilters}
                style={[
                  styles.resetBtn,
                  { backgroundColor: theme.colors.error },
                ]}
              >
                <Ionicons name="refresh" size={16} color="#fff" />
                <Text
                  style={[
                    textStyles.labelMd,
                    { color: "#fff", marginLeft: spacing[1] },
                  ]}
                >
                  Clear All Filters
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Footer - Close */}
          <TouchableOpacity
            onPress={onClose}
            style={[styles.applyBtn, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={[textStyles.labelMd, { color: "#fff" }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badgeCount: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    maxHeight: "90%",
    minHeight: "60%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing[4],
    flexShrink: 0,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: 12,
    borderWidth: 1,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[2],
    borderRadius: 8,
    marginHorizontal: spacing[4],
  },
  applyBtn: {
    paddingVertical: spacing[3],
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing[4],
    marginVertical: spacing[4],
  },
});
