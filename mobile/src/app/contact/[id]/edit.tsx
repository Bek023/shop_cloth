import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useContact, useStore } from '../../../lib/store';
import { ContactForm } from '../../../ui/ContactForm';

export default function EditContact() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contact = useContact(id);
  const updateContact = useStore((s) => s.updateContact);

  if (!contact) return <Redirect href="/(tabs)" />;

  return (
    <ContactForm
      initial={contact}
      editingId={contact.id}
      submitLabel="Saqlash"
      onSubmit={(d) => {
        updateContact(contact.id, { name: d.name, phone: d.phone, note: d.note?.trim() || undefined });
        router.back();
      }}
    />
  );
}
