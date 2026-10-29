import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { daysLeft, isValidDate, toYMD } from '../data/documents';
import { newId } from '../storage';
import { colors } from '../theme';
import {
  CLAIMANT_LABEL,
  Claim,
  Claimant,
  ClaimType,
  INSURERS,
  TYPE_LABEL,
} from '../types';
import { Button, Chip, card, topPad } from '../ui';

const today = () => toYMD(new Date());

export default function NewClaimScreen({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (c: Claim) => void;
}) {
  const [claimant, setClaimant] = useState<Claimant>('self');
  const [type, setType] = useState<ClaimType>('outpatient');
  const [hospital, setHospital] = useState('');
  const [visitDate, setVisitDate] = useState(today());
  const [amount, setAmount] = useState('');
  const [insurer, setInsurer] = useState('');

  const submit = () => {
    if (!hospital.trim()) return Alert.alert('병원(약국) 이름을 입력해 주세요');
    if (!isValidDate(visitDate)) return Alert.alert('진료일을 2026-10-29 형식으로 입력해 주세요');
    if (daysLeft(visitDate) < 0)
      return Alert.alert('청구 기한(3년)이 지났어요', '보험사에 예외 적용이 가능한지 먼저 문의해 보세요.');
    if (!insurer) return Alert.alert('보험사를 선택해 주세요');
    const amt = parseInt(amount.replace(/[^0-9]/g, ''), 10) || 0;
    onCreate({
      id: newId(),
      createdAt: Date.now(),
      claimant,
      type,
      hospital: hospital.trim(),
      visitDate,
      amount: amt,
      insurer,
      attachments: {},
      checks: {},
      status: 'draft',
    });
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: topPad, padding: 16, paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={onCancel}>
        <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>‹ 뒤로</Text>
      </Pressable>
      <Text style={s.title}>새 청구 만들기</Text>

      <Text style={s.label}>누구의 청구인가요?</Text>
      <View style={s.row}>
        {(Object.keys(CLAIMANT_LABEL) as Claimant[]).map((k) => (
          <Chip key={k} label={CLAIMANT_LABEL[k]} selected={claimant === k} onPress={() => setClaimant(k)} />
        ))}
      </View>

      <Text style={s.label}>어떤 진료였나요?</Text>
      <View style={s.row}>
        {(Object.keys(TYPE_LABEL) as ClaimType[]).map((k) => (
          <Chip key={k} label={TYPE_LABEL[k]} selected={type === k} onPress={() => setType(k)} />
        ))}
      </View>

      <View style={[card, { marginTop: 8 }]}>
        <Text style={s.fieldLabel}>병원(약국) 이름</Text>
        <TextInput style={s.input} value={hospital} onChangeText={setHospital} placeholder="예) 분당서울대병원" />

        <Text style={s.fieldLabel}>진료일 (청구 기한은 3년)</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={[s.input, { flex: 1 }]}
            value={visitDate}
            onChangeText={setVisitDate}
            placeholder="2026-10-29"
            keyboardType="numbers-and-punctuation"
          />
          <Pressable onPress={() => setVisitDate(today())} style={{ marginLeft: 8 }}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>오늘</Text>
          </Pressable>
        </View>

        <Text style={s.fieldLabel}>본인이 낸 진료비 (원)</Text>
        <TextInput
          style={s.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="예) 35000"
          keyboardType="number-pad"
        />
      </View>

      <Text style={s.label}>어느 보험사에 청구하나요?</Text>
      <View style={s.row}>
        {INSURERS.map((n) => (
          <Chip key={n} label={n} selected={insurer === n} onPress={() => setInsurer(n)} />
        ))}
      </View>

      <Button title="서류 체크리스트 만들기" onPress={submit} style={{ marginTop: 16 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: 12, marginBottom: 8 },
  label: { marginTop: 18, marginBottom: 10, fontSize: 16, fontWeight: '800', color: colors.text },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  fieldLabel: { fontSize: 13, color: colors.sub, marginTop: 10, marginBottom: 6, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
    backgroundColor: '#fff',
    color: colors.text,
  },
});
