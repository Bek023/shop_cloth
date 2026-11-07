import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useConfirm } from './confirm';
import { Button } from './kit';
import { colors, font, radius, space } from './theme';

export function ConfirmHost() {
  const pending = useConfirm((s) => s.pending);
  const close = useConfirm((s) => s.close);

  return (
    <Modal visible={!!pending} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={s.backdrop} onPress={close} accessibilityLabel="Yopish">
        <Pressable style={s.sheet} onPress={() => {}} accessibilityRole="alert">
          <Text style={s.title}>{pending?.title}</Text>
          <Text style={s.message}>{pending?.message}</Text>
          <View style={s.actions}>
            <Button variant="secondary" title="Bekor qilish" onPress={close} style={{ flex: 1 }} />
            <Button
              variant="gave"
              title={pending?.okLabel ?? 'OK'}
              testID="confirm-ok"
              style={{ flex: 1 }}
              onPress={() => {
                const run = pending?.onOk;
                close();
                run?.();
              }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', padding: space.xl },
  sheet: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.xl, gap: space.md, maxWidth: 420, width: '100%', alignSelf: 'center' },
  title: { fontSize: font.lg, fontWeight: '800', color: colors.text },
  message: { fontSize: font.md, color: colors.muted },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
});
