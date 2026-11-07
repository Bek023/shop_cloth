import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, font, radius, space } from './theme';

export function Screen({
  children,
  scroll = true,
  edges = ['bottom'],
  footer,
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  footer?: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={styles.flex}>{children}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gave' | 'got';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
  testID,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const v = buttonVariants[variant];
  const isOff = disabled || loading;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isOff, busy: !!loading }}
      onPress={onPress}
      disabled={isOff}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: v.bg, borderColor: v.border },
        pressed && { opacity: 0.85 },
        isOff && { opacity: 0.45 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={v.fg} /> : <Text style={[styles.buttonText, { color: v.fg }]}>{title}</Text>}
    </Pressable>
  );
}

const buttonVariants: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.primary, fg: colors.white, border: colors.primary },
  secondary: { bg: colors.card, fg: colors.primary, border: colors.border },
  ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
  danger: { bg: colors.card, fg: colors.gave, border: colors.gaveSoft },
  gave: { bg: colors.gave, fg: colors.white, border: colors.gave },
  got: { bg: colors.got, fg: colors.white, border: colors.got },
};

export function Field({
  label,
  error,
  hint,
  prefix,
  big,
  ...input
}: TextInputProps & { label: string; error?: string; hint?: string; prefix?: string; big?: boolean }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, error ? { borderColor: colors.gave } : null]}>
        {prefix ? <Text style={[styles.prefix, big && styles.bigText]}>{prefix}</Text> : null}
        <TextInput
          placeholderTextColor={colors.muted}
          style={[styles.input, big && styles.bigText]}
          accessibilityLabel={label}
          {...input}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented} accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>📒</Text>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
      {action ? <View style={{ marginTop: space.lg, alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  );
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials || '?'}</Text>
    </View>
  );
}

export function Badge({ label, tone }: { label: string; tone: 'gave' | 'got' | 'warn' | 'muted' }) {
  const map = {
    gave: [colors.gaveSoft, colors.gave],
    got: [colors.gotSoft, colors.got],
    warn: [colors.warnSoft, colors.warn],
    muted: [colors.bg, colors.muted],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: space.lg, gap: space.md, flexGrow: 1 },
  footer: {
    padding: space.lg,
    gap: space.sm,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  button: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  buttonText: { fontSize: font.md, fontWeight: '700' },
  field: { gap: space.xs },
  label: { fontSize: font.sm, color: colors.muted, fontWeight: '600' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
  },
  prefix: { fontSize: font.lg, color: colors.muted, marginRight: space.xs },
  input: { flex: 1, minWidth: 0, minHeight: 50, fontSize: font.lg, color: colors.text },
  bigText: { fontSize: font.xxl, fontWeight: '700' },
  error: { fontSize: font.sm, color: colors.gave },
  hint: { fontSize: font.sm, color: colors.muted },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  segmented: { flexDirection: 'row', backgroundColor: colors.border, borderRadius: radius.md, padding: 3 },
  segment: { flex: 1, paddingVertical: space.sm, borderRadius: radius.sm, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.card },
  segmentText: { fontSize: font.sm, color: colors.muted, fontWeight: '600' },
  segmentTextActive: { color: colors.text },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { fontSize: font.sm, color: colors.text },
  chipTextActive: { color: colors.primaryDark, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: space.xxl, paddingHorizontal: space.lg },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  emptyIconText: { fontSize: 28, color: colors.primary, fontWeight: '700' },
  emptyTitle: { fontSize: font.lg, fontWeight: '700', color: colors.text, textAlign: 'center' },
  emptyBody: { fontSize: font.md, color: colors.muted, textAlign: 'center', marginTop: space.xs },
  avatar: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primaryDark, fontWeight: '700' },
  badge: { paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: radius.pill, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: font.sm, color: colors.muted, fontWeight: '700', textTransform: 'uppercase', marginTop: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  title: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  body: { fontSize: font.md, color: colors.text },
  muted: { fontSize: font.sm, color: colors.muted },
});
