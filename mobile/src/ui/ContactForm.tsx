import { useState } from 'react';
import { Text } from 'react-native';
import type { Contact, ContactKind } from '../lib/ledger';
import { formatPhone, isValidPhone, parsePhone } from '../lib/money';
import { useContacts } from '../lib/store';
import { Button, Field, Screen, Segmented, styles } from './kit';
import { colors } from './theme';

export type ContactDraft = { kind: ContactKind; name: string; phone?: string; note?: string };

export function ContactForm({
  initial,
  editingId,
  submitLabel,
  onSubmit,
}: {
  initial: ContactDraft;
  editingId?: string;
  submitLabel: string;
  onSubmit: (d: ContactDraft) => void;
}) {
  const contacts = useContacts();
  const [kind, setKind] = useState<ContactKind>(initial.kind);
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone ?? '');
  const [note, setNote] = useState(initial.note ?? '');
  const [touched, setTouched] = useState(false);

  const nameError = touched && name.trim().length < 2 ? 'Ism kamida 2 harf bo‘lsin' : undefined;
  const phoneError = phone.length > 0 && !isValidPhone(phone) ? 'Raqam 9 ta raqamdan iborat bo‘lishi kerak' : undefined;
  const duplicate: Contact | undefined =
    isValidPhone(phone) ? Object.values(contacts).find((c) => c.phone === phone && c.id !== editingId) : undefined;
  const valid = name.trim().length >= 2 && !phoneError;

  const submit = () => {
    setTouched(true);
    if (!valid) return;
    onSubmit({ kind, name, phone: phone || undefined, note });
  };

  return (
    <Screen footer={<Button title={submitLabel} onPress={submit} disabled={!valid} testID="contact-submit" />}>
      {!editingId ? (
        <Segmented
          value={kind}
          onChange={setKind}
          options={[
            { value: 'customer', label: 'Mijoz' },
            { value: 'supplier', label: 'Ta’minotchi' },
          ]}
        />
      ) : null}
      <Field
        label="Ism"
        value={name}
        onChangeText={setName}
        onBlur={() => setTouched(true)}
        placeholder="Masalan: Aziz Karimov"
        autoFocus={!editingId}
        maxLength={60}
        error={nameError}
      />
      <Field
        label="Telefon (ixtiyoriy)"
        prefix="+998"
        value={formatPhone(phone).replace(/^\+998 ?/, '')}
        onChangeText={(t) => setPhone(parsePhone(t))}
        keyboardType="phone-pad"
        placeholder="90 123 45 67"
        error={phoneError}
        hint="Eslatma yuborish uchun kerak"
      />
      {duplicate ? (
        <Text style={[styles.muted, { color: colors.warn }]}>Bu raqam “{duplicate.name}” da ham bor.</Text>
      ) : null}
      <Field label="Izoh (ixtiyoriy)" value={note} onChangeText={setNote} placeholder="Masalan: 3-uy, qo‘shni" maxLength={200} />
    </Screen>
  );
}
