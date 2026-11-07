import { Redirect, router, Stack, useLocalSearchParams } from 'expo-router';
import type { TxType } from '../../../lib/ledger';
import { useStore, useSummaries } from '../../../lib/store';
import { TxForm } from '../../../ui/TxForm';

export default function AddTx() {
  const { id, type: rawType } = useLocalSearchParams<{ id: string; type?: TxType }>();
  const type: TxType = rawType === 'got' ? 'got' : 'gave';
  const contact = useStore((s) => s.contacts[id]);
  const addTx = useStore((s) => s.addTx);
  const balance = useSummaries()[id]?.balance ?? 0;

  if (!contact) return <Redirect href="/(tabs)" />;

  return (
    <>
      <Stack.Screen options={{ title: type === 'gave' ? 'Berdim' : 'Oldim' }} />
      <TxForm
        type={type}
        contactName={contact.name}
        currentBalance={balance}
        submitLabel="Saqlash"
        onSubmit={(d) => {
          addTx({ contactId: id, type, ...d });
          router.back();
        }}
      />
    </>
  );
}
