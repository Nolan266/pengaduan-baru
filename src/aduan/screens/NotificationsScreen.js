// Layar Notifikasi.
import React from 'react';
import { View, ScrollView } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { stamp } from '../format';
import { useRC } from '../theme';
import { FadeIn } from '../tg';
import { Txt, Card, Btn, PageTop } from '../ui';

export function NotificationsPage({ data, only, onReadAll, onAll, onOpen }) {
  const rc = useRC();
  const entries = data.events.filter((e) => !only || e.report === only);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} refreshControl={rc}>
      <PageTop title="Notifikasi" right={<Btn title="Tandai dibaca" onPress={onReadAll} />} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Txt small secondary style={{ flex: 1 }}>Pemberitahuan perkembangan aduan Anda.</Txt>
        {only ? <Btn title="Semua" onPress={onAll} /> : null}
      </View>
      {entries.length ? entries.map((e, i) => (
        <FadeIn key={e.id} delay={Math.min(i, 6) * 70} y={16}>
        <Card style={!data.read.includes(e.id) ? { borderLeftWidth: 3, borderLeftColor: '#3b82f6' } : null}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center' }}>
              <FontAwesome6 name={e.icon} size={14} color="#2563eb" />
            </View>
            <View style={{ flex: 1 }}>
              <Txt bold style={{ fontSize: 14 }}>Aduan {e.status.toLowerCase()}</Txt>
              <Txt style={{ marginTop: 3 }}>{e.body}</Txt>
              <Txt small secondary style={{ marginTop: 3 }}>#{e.report} · {e.title}</Txt>
              <Txt small secondary>{stamp(e.time)}</Txt>
              {data.reports.some((x) => x.id === e.report)
                ? <Btn title="Buka aduan" onPress={() => onOpen(e.report)} style={{ marginTop: 8, alignSelf: 'flex-start' }} />
                : null}
            </View>
          </View>
        </Card>
        </FadeIn>
      )) : <Card><Txt style={{ textAlign: 'center', padding: 16 }}>Belum ada notifikasi.</Txt></Card>}
    </ScrollView>
  );
}