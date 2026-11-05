// Komponen UI kecil yang dipakai di banyak layar.
import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, Image, Modal,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { AVATAR } from './constants';
import { useTheme } from './theme';

export function Txt({ style, small, bold, secondary, children, ...rest }) {
  const { c } = useTheme();
  return (
    <Text {...rest} style={[{ color: secondary ? c.secondary : c.ink, fontSize: small ? 11 : 13, lineHeight: small ? 16 : 19 },
      bold && { fontWeight: '700' }, style]}>{children}</Text>
  );
}

export function Card({ style, children }) {
  const { c } = useTheme();
  return <View style={[{ backgroundColor: c.surface, borderColor: c.edge, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 }, style]}>{children}</View>;
}

export function Btn({ title, onPress, primary, icon, disabled, active, danger, style }) {
  const { c } = useTheme();
  const hi = primary || active;
  const fg = hi ? '#fff' : danger ? '#dc2626' : c.ink;
  return (
    <Pressable onPress={onPress} disabled={disabled}
      style={({ pressed }) => [{ paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1,
        backgroundColor: hi ? '#2563eb' : c.surface, borderColor: hi ? '#2563eb' : danger ? '#dc2626' : c.edge,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }, style]}>
      {icon ? <FontAwesome6 name={icon} size={12} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: 12, fontWeight: '700' }}>{title}</Text>
    </Pressable>
  );
}

export function Badge({ status }) {
  const m = status === 'Selesai' ? ['#d1fae5', '#065f46'] : status === 'Dibuat' ? ['#fef3c7', '#92400e'] : ['#e0e7ff', '#3730a3'];
  return (
    <View style={{ backgroundColor: m[0], borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 }}>
      <Text style={{ color: m[1], fontSize: 10, fontWeight: '700' }}>{status}</Text>
    </View>
  );
}

export function Progress({ value }) {
  const { c } = useTheme();
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <View style={{ height: 5, borderRadius: 5, backgroundColor: c.edge, marginVertical: 9, overflow: 'hidden' }}>
      <View style={{ width: `${v}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: 5 }} />
    </View>
  );
}

export function Avatar({ size, uri }) {
  const { c } = useTheme();
  return (
    <View style={{ width: size, height: size }}>
      <Image source={uri ? { uri } : AVATAR} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.screen }} />
      <View style={{ position: 'absolute', right: 0, bottom: 1, width: 10, height: 10, borderRadius: 5,
        backgroundColor: '#10b981', borderWidth: 2, borderColor: c.surface }} />
    </View>
  );
}

export function Field({ label, style, multiline, ...rest }) {
  const { c } = useTheme();
  return (
    <View style={{ marginVertical: 8 }}>
      <Txt small bold style={{ marginBottom: 5, fontSize: 12 }}>{label}</Txt>
      <TextInput {...rest} multiline={multiline} placeholderTextColor={c.secondary}
        style={[{ borderWidth: 1, borderColor: c.edge, borderRadius: 10, padding: 10, backgroundColor: c.screen,
          color: c.ink, fontSize: 13 }, multiline && { minHeight: 90, textAlignVertical: 'top' }, style]} />
    </View>
  );
}

export function PageTop({ title, right }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <Txt style={{ fontSize: 20, fontWeight: '800' }}>{title}</Txt>
      {right}
    </View>
  );
}

export function Dropdown({ label, value, options, onChange }) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const cur = options.find((o) => o.value === value) || options[0];
  const active = value !== options[0].value;
  return (
    <View style={{ flex: 1 }}>
      <Txt small secondary style={{ marginBottom: 4 }}>{label}</Txt>
      <Pressable onPress={() => setOpen(true)}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          borderWidth: 1, borderColor: active ? '#2563eb' : c.edge, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12,
          backgroundColor: c.surface, opacity: pressed ? 0.8 : 1 })}>
        <Text numberOfLines={1} style={{ flex: 1, color: active ? c.link : c.ink, fontSize: 13, fontWeight: '600' }}>{cur.label}</Text>
        <FontAwesome6 name="chevron-down" size={11} color={c.secondary} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: '#020617aa', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: c.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
            padding: 16, paddingBottom: 28, maxHeight: '70%', width: '100%', maxWidth: 520, alignSelf: 'center',
            borderWidth: 1, borderColor: c.edge }}>
            <Txt bold style={{ fontSize: 15, marginBottom: 8 }}>{label}</Txt>
            <ScrollView>
              {options.map((o) => {
                const on = o.value === value;
                return (
                  <Pressable key={o.value} onPress={() => { onChange(o.value); setOpen(false); }}
                    style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      paddingVertical: 13, paddingHorizontal: 10, borderRadius: 10,
                      backgroundColor: on ? c.indigoBg : pressed ? c.screen : 'transparent' })}>
                    <Text style={{ color: on ? c.indigoText : c.ink, fontSize: 14, fontWeight: on ? '700' : '500' }}>{o.label}</Text>
                    {on ? <FontAwesome6 name="check" size={13} color={c.indigoText} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function ConfirmModal({ visible, title, message, confirmText, busy, onConfirm, onCancel }) {
  const { c } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: '#020617cc', justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: c.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: c.edge }}>
          <Txt bold style={{ fontSize: 16 }}>{title}</Txt>
          <Txt style={{ marginVertical: 10 }}>{message}</Txt>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Btn style={{ flex: 1 }} title="Tidak" onPress={onCancel} disabled={busy} />
            <Btn style={{ flex: 1 }} danger title={busy ? 'Memproses…' : confirmText} onPress={onConfirm} disabled={busy} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
