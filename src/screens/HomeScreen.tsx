import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { daysLeft, getProgress } from '../data/documents';
import { colors } from '../theme';
import { CLAIMANT_LABEL, Claim, TYPE_LABEL } from '../types';
import { Badge, Button, ProgressBar, card, topPad } from '../ui';

export default function HomeScreen({
  claims,
  onNew,
  onOpen,
}: {
  claims: Claim[];
  onNew: () => void;
  onOpen: (id: string) => void;
}) {
  const sorted = [...claims].sort((a, b) => b.createdAt - a.createdAt);
  const active = sorted.filter((c) => c.status === 'draft');
  const sent = sorted.filter((c) => c.status === 'sent');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: topPad, padding: 16, paddingBottom: 120 }}>
        <Text style={s.title}>청구메이트</Text>
        <Text style={s.sub}>병원 서류를 모아 보험사에 보낼 한 개의 PDF로 만들어 드려요</Text>

        <View style={[card, { backgroundColor: colors.infoBg, borderColor: colors.infoBg, marginTop: 16 }]}>
          <Text style={s.tipTitle}>먼저 확인해 보세요</Text>
          <Text style={s.tipBody}>
            다녀온 병원이 '실손24'에 연결돼 있으면 서류 없이도 청구돼요. 네이버지도나 카카오맵에서 '실손24'로
            검색해 확인하고, 연결이 안 된 병원일 때 이 앱으로 서류를 모으세요.
          </Text>
        </View>

        <Text style={s.section}>진행 중 {active.length}건</Text>
        {active.length === 0 && (
          <View style={card}>
            <Text style={{ color: colors.sub, lineHeight: 21 }}>
              아직 정리 중인 청구가 없어요. 아래 '새 청구 만들기'를 눌러 시작하세요.
            </Text>
          </View>
        )}
        {active.map((c) => (
          <ClaimRow key={c.id} claim={c} onPress={() => onOpen(c.id)} />
        ))}

        {sent.length > 0 && <Text style={s.section}>전달 완료 {sent.length}건</Text>}
        {sent.map((c) => (
          <ClaimRow key={c.id} claim={c} onPress={() => onOpen(c.id)} />
        ))}

        <Text style={s.privacy}>
          진료 서류는 이 폰 안에만 저장되고 서버로 보내지 않아요. 보험사에 보낼 때만 내가 고른 앱으로 전달돼요.
        </Text>
      </ScrollView>
      <View style={s.fab}>
        <Button title="새 청구 만들기" onPress={onNew} />
      </View>
    </View>
  );
}

function ClaimRow({ claim, onPress }: { claim: Claim; onPress: () => void }) {
  const p = getProgress(claim);
  const left = daysLeft(claim.visitDate);
  const urgent = claim.status === 'draft' && left <= 90;
  return (
    <Pressable onPress={onPress} style={[card, { marginBottom: 10 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={s.rowTitle}>{claim.hospital}</Text>
        {claim.status === 'sent' ? (
          <Badge label="전달 완료" tone="ok" />
        ) : urgent ? (
          <Badge label={left < 0 ? '기한 지남' : `D-${left}`} tone="danger" />
        ) : (
          <Badge label="준비 중" tone="info" />
        )}
      </View>
      <Text style={s.rowSub}>
        {claim.visitDate} · {TYPE_LABEL[claim.type]} · {CLAIMANT_LABEL[claim.claimant]} · {claim.insurer}
      </Text>
      {claim.status === 'draft' && (
        <View style={{ marginTop: 12 }}>
          <ProgressBar value={p.done} total={p.total} />
          <Text style={s.rowSub}>
            서류 {p.done}/{p.total} 준비
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  sub: { marginTop: 4, color: colors.sub, fontSize: 14 },
  tipTitle: { fontWeight: '800', color: colors.primaryDark, marginBottom: 4 },
  tipBody: { color: colors.text, lineHeight: 21, fontSize: 14 },
  section: { marginTop: 22, marginBottom: 8, fontSize: 16, fontWeight: '800', color: colors.text },
  rowTitle: { fontSize: 17, fontWeight: '700', color: colors.text, flexShrink: 1, marginRight: 8 },
  rowSub: { marginTop: 6, color: colors.sub, fontSize: 13 },
  privacy: { marginTop: 24, color: colors.sub, fontSize: 12, lineHeight: 18 },
  fab: { position: 'absolute', left: 16, right: 16, bottom: 28 },
});
