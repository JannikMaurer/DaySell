import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle, type TextStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme, type as T } from './theme';

// Weichzeichner auf dem iPhone und im Browser (Safari kann das), Android ohne.
const BLUR = Platform.OS === 'ios' || Platform.OS === 'web';

/** Glasfläche: weichgezeichneter Hintergrund, helle Kante. Auf Android ohne Weichzeichner, dafür etwas dichter. */
export function Glass({ style, radius = 28, children }: { style?: StyleProp<ViewStyle>; radius?: number; children?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth * 2, borderColor: t.edge }, style]}>
      {BLUR ? (
        <BlurView intensity={t.dark ? 40 : 55} tint={t.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      ) : null}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: BLUR ? t.glass : t.dark ? 'rgba(40,48,96,0.72)' : 'rgba(255,255,255,0.72)' }]}
      />
      {children}
    </View>
  );
}

/** Hintergrund mit weichen Farbflächen hinter dem Glas. */
export function Backdrop() {
  const t = useTheme();
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: t.bg, overflow: 'hidden' }]}>
      <View style={[styles.blob, { width: 360, height: 360, left: -140, top: -80, backgroundColor: t.blobs[0] }]} />
      <View style={[styles.blob, { width: 300, height: 300, right: -120, top: 260, backgroundColor: t.blobs[1] }]} />
      <View style={[styles.blob, { width: 340, height: 340, left: -60, bottom: -40, backgroundColor: t.blobs[2] }]} />
      {BLUR ? <BlurView intensity={80} tint={t.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} /> : null}
    </View>
  );
}

const pressed = { transform: [{ scale: 0.96 }], opacity: 0.9 };

type BtnProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
  icon?: string;
  accessibilityLabel?: string;
};

/** Hauptaktion: blau getönt. */
export function PrimaryButton({ label, onPress, disabled, style, small, icon }: BtnProps) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed: p }) => [
        styles.btn,
        { height: small ? 44 : 56, borderRadius: small ? 22 : 28, paddingHorizontal: small ? 20 : 24 },
        disabled
          ? { backgroundColor: t.track }
          : { backgroundColor: t.btn, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', shadowColor: t.btn, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
        p && !disabled && pressed,
        style,
      ]}
    >
      <Text style={{ color: disabled ? t.faint : t.btnText, fontSize: small ? 15 : 17, fontWeight: '700' }}>
        {icon ? icon + '  ' : ''}
        {label}
      </Text>
    </Pressable>
  );
}

/** Nebenaktion: klares Glas. */
export function GlassButton({ label, onPress, style, small = true, accessibilityLabel, textStyle }: BtnProps & { textStyle?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={({ pressed: p }) => [p && pressed, style]}>
      <Glass radius={small ? 22 : 27} style={[styles.btn, { height: small ? 44 : 54, minWidth: 44, paddingHorizontal: label.length > 2 ? 16 : 0 }]}>
        <Text style={[{ color: t.ink, fontSize: small ? 15 : 16, fontWeight: small ? '600' : '700' }, textStyle]}>{label}</Text>
      </Glass>
    </Pressable>
  );
}

/** Zahnrad als Linienzeichnung, sieht auf allen Geräten gleich aus (kein Schriftzeichen). */
export function GearIcon({ size = 22, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={3} />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Svg>
  );
}

/** Runde Glas-Taste mit Symbol, 44 × 44. */
export function IconButton({ onPress, accessibilityLabel, children }: { onPress: () => void; accessibilityLabel: string; children: React.ReactNode }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={({ pressed: p }) => [p && pressed]}>
      <Glass radius={22} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        {/* Eigene Ebene, sonst malt der Browser das Glas über die Zeichnung. */}
        <View>{children}</View>
      </Glass>
    </Pressable>
  );
}

/** Kleine Aktion: zart blau hinterlegt. */
export function TintButton({ label, onPress, style, icon }: BtnProps) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed: p }) => [styles.btn, { height: 44, borderRadius: 22, paddingHorizontal: 16, backgroundColor: t.tint, borderWidth: 1, borderColor: t.tintEdge }, p && pressed, style]}
    >
      <Text style={{ color: t.accent, fontSize: 15, fontWeight: '600' }}>
        {icon ? icon + ' ' : ''}
        {label}
      </Text>
    </Pressable>
  );
}

/** Löschen: ✕ in runder Fläche, Trefferfläche 44 × 44. */
export function DeleteButton({ onPress, label }: { onPress: () => void; label: string }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.x} hitSlop={4}>
      {({ pressed: p }) => (
        <View style={[styles.xc, { backgroundColor: p ? t.tint : t.track }]}>
          <Text style={{ color: p ? t.red : t.muted, fontSize: 13, fontWeight: '700' }}>✕</Text>
        </View>
      )}
    </Pressable>
  );
}

/** Auswahl-Kapsel für Umschläge. */
export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed: p }) => [
        styles.btn,
        { height: 44, borderRadius: 22, paddingHorizontal: 16, borderWidth: 1 },
        selected ? { backgroundColor: t.sel, borderColor: t.sel } : { backgroundColor: t.field, borderColor: t.edge },
        p && pressed,
      ]}
    >
      <Text style={{ color: selected ? t.selText : t.ink, fontSize: 15, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

/** Kopfzeile: links, Titel mittig, rechts. */
export function TopBar({ left, title, right }: { left?: React.ReactNode; title?: string; right?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={styles.top}>
      <View style={styles.side}>{left}</View>
      {title ? (
        <Text numberOfLines={2} style={[T.h2, { color: t.ink, flex: 1, textAlign: 'center' }]}>
          {title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      <View style={[styles.side, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );
}

export function Bar({ pct, over }: { pct: number; over?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ marginTop: 6, height: 8, borderRadius: 4, backgroundColor: t.track, overflow: 'hidden' }}>
      <View style={{ height: '100%', width: `${Math.max(0, Math.min(100, pct))}%`, borderRadius: 4, backgroundColor: over ? t.red : t.accent }} />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: { position: 'absolute', borderRadius: 999, opacity: BLUR ? 0.65 : 0.28 },
  btn: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  x: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  xc: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  side: { minWidth: 84 },
});
