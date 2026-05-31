import { Card, Metric, Text } from "@tremor/react";

type MetricCardProps = {
  label: string;
  value: string;
  subtext?: string;
};

export function MetricCard({ label, value, subtext }: MetricCardProps) {
  return (
    <Card
      className="bg-[var(--color-surface)] ring-[var(--color-border-soft)] shadow-none hover:ring-[var(--color-border-strong)] transition-all duration-200"
      decoration="top"
      decorationColor="cyan"
    >
      <Text className="label-eyebrow">{label}</Text>
      <Metric className="mt-2 font-mono text-[var(--color-text-primary)]">
        {value}
      </Metric>
      {subtext && (
        <Text className="mt-1 text-xs text-[var(--color-text-tertiary)]">
          {subtext}
        </Text>
      )}
    </Card>
  );
}
