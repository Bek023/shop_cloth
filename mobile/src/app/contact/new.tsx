import { router, useLocalSearchParams } from 'expo-router';
import type { ContactKind } from '../../lib/ledger';
import { useStore } from '../../lib/store';
import { ContactForm } from '../../ui/ContactForm';

export default function NewContact() {
  const { kind } = useLocalSearchParams<{ kind?: ContactKind }>();
  const addContact = useStore((s) => s.addContact);

  return (
    <ContactForm
      initial={{ kind: kind === 'supplier' ? 'supplier' : 'customer', name: '' }}
      submitLabel="Saqlash"
      onSubmit={(d) => {
        const id = addContact(d);
        // Straight to the contact page: the next thing is usually the first entry.
        router.replace(`/contact/${id}`);
      }}
    />
  );
}
