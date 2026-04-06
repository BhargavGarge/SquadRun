import React from "react";
import { Text, StyleSheet } from "react-native";
import GlassCard from "./GlassCard";
import { textStyles } from "../../theme/typography";
import { spacing } from "../../theme/spacing";

interface StatCardProps {
  label: string;
  value: string;
  theme: any;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, theme }) => {
  return (
    <GlassCard style={styles.statCard}>
      <Text
        style={[textStyles.labelSm, { color: theme.colors.on_surface_variant }]}
      >
        {label}
      </Text>
      <Text
        style={[
          textStyles.headlineMd,
          { color: theme.colors.primary, marginTop: spacing[1] },
        ]}
      >
        {value}
      </Text>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    minWidth: "48%",
  },
});

export default StatCard;
