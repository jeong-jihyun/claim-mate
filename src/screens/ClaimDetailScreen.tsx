import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { DocItem, buildChecklist, daysLeft, getProgress } from '../data/documents';
import { cancelNotification } from '../notify';
import { buildBundle } from '../pdf';
import { importAttachment, removeFile } from '../storage';
import { colors } from '../theme';
import { CLAIMANT_LABEL, Claim, TYPE_LABEL } from '../types';
import { Badge, Button, ProgressBar, card, topPad } from '../ui';

export default function ClaimDetailScreen({
  claim,
  onChange,
  onBack,
  onDelete,
}: {
  claim: Claim;
  onChange: (c: Claim) => void;
  onBack: () => void;
  onDelete: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const items = buildChecklist(claim);
  const p = getProgress(claim);
  const left = daysLeft(claim.visitDate);
  const complete = p.done === p.total;
  const sent = claim.status === 'sent';

  const addFile = async (item: DocItem, srcUri: string, name: string, kind: 'image' | 'pdf') => {
    const att = await importAttachment(claim.id, srcUri, name, kind);
    onChange({
      ...claim,
      attachments: { ...claim.attachments, [item.id]: [...(claim.attachments[item.id] ?? []), att] },
    });
  };

  const takePhoto = async (item: DocItem) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert('카메라 권한이 필요해요', '설정에서 카메라를 허용해 주세요.');
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!r.canceled && r.assets[0]) await addFile(item, r.assets[0].uri, item.label, 'image');
  };

  const pickAlbum = async (item: DocItem) => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      allowsMultipleSelection: true,
    });
    if (r.canceled) return;
    for (const a of r.assets) await addFile(item, a.uri, item.label, 'image');
  };

  const pickPdf = async (item: DocItem) => {
    const r = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
      multiple: true,
    });
    if (r.canceled) return;
    for (const a of r.assets) {
      const isPdf = (a.mimeType ?? '').includes('pdf') || a.name.toLowerCase().endsWith('.pdf');
      await addFile(item, a.uri, a.name, isPdf ? 'pdf' : 'image');
    }
  };

  const removeAtt = (item: DocItem, attId: string) => {
    const list = claim.attachments[item.id] ?? [];
    const target = list.find((a) => a.id === attId);
    if (target) removeFile(target.uri);
    onChange({
      ...claim,
      attachments: { ...claim.attachments, [item.id]: list.filter((a) => a.id !== attId) },
    });
  };

  const toggleCheck = (item: DocItem) =>
    onChange({ ...claim, checks: { ...claim.checks, [item.id]: !claim.checks[item.id] } });

  const makeAndShare = async () => {
    setBusy(true);
    try {
      const uri = await buildBundle(claim);
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('이 기기에서는 공유를 쓸 수 없어요');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `${claim.insurer}에 보낼 청구 서류`,
        UTI: 'com.adobe.pdf',
      });
      Alert.alert('보험사에 보내셨나요?', '보냈다면 전달 완료로 표시하고 기한 알림을 꺼 둘게요.', [
        { text: '아직이에요', style: 'cancel' },
        {
          text: '보냈어요',
          onPress: async () => {
            await cancelNotification(claim.notifId);
            onChange({ ...claim, status: 'sent', sentAt: Date.now(), notifId: undefined });
          },
        },
      ]);
    } catch (e) {
      Alert.alert('PDF를 만들지 못했어요', String(e));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = () =>
    Alert.alert('이 청구를 삭제할까요?', '올린 서류도 이 폰에서 함께 지워져요.', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: onDelete },
    ]);

  let lastGroup: string | undefined;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: topPad, padding: 16, paddingBottom: 140 }}>
        <Pressable onPress={onBack}>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>‹ 목록</Text>
        </Pressable>
        <Text style={s.title}>{claim.hospital}</Text>
        <Text style={s.sub}>
          {claim.visitDate} · {TYPE_LABEL[claim.type]} · {CLAIMANT_LABEL[claim.claimant]} · {claim.insurer}
        </Text>
        {claim.amount > 0 && <Text style={s.sub}>본인부담 {claim.amount.toLocaleString('ko-KR')}원</Text>}

        <View style={[card, { marginTop: 14 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={s.cardTitle}>서류 {p.done}/{p.total} 준비</Text>
            {sent ? (
              <Badge label="전달 완료" tone="ok" />
            ) : (
              <Badge
                label={left < 0 ? '기한 지남' : `청구 기한 D-${left}`}
                tone={left <= 90 ? 'danger' : 'info'}
              />
            )}
          </View>
          <ProgressBar value={p.done} total={p.total} />
          {!complete && !sent && (
            <Text style={[s.sub, { marginTop: 10 }]}>남은 서류: {p.missing.join(', ')}</Text>
          )}
        </View>

        {items.map((it) => {
          const showGroupHeader = it.group && it.group !== lastGroup;
          lastGroup = it.group;
          const atts = claim.attachments[it.id] ?? [];
          const done = it.kind === 'check' ? !!claim.checks[it.id] : atts.length > 0;
          return (
            <View key={it.id}>
              {showGroupHeader && <Text style={s.group}>{it.groupLabel}</Text>}
              <View style={[card, { marginTop: 10 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[s.check, done && { color: colors.ok }]}>{done ? '✔' : '○'}</Text>
                  <Text style={s.itemTitle}>{it.label}</Text>
                  {!it.required && <Badge label="선택" tone="info" />}
                </View>
                <Text style={s.hint}>{it.hint}</Text>

                {it.kind === 'check' ? (
                  <Button
                    title={done ? '확인했어요 ✔' : '확인했어요'}
                    kind={done ? 'ghost' : 'primary'}
                    onPress={() => toggleCheck(it)}
                    disabled={sent}
                    style={{ marginTop: 10 }}
                  />
                ) : (
                  <>
                    {atts.length > 0 && (
                      <ScrollView horizontal style={{ marginTop: 10 }}>
                        {atts.map((a) => (
                          <View key={a.id} style={s.thumbWrap}>
                            {a.kind === 'image' ? (
                              <Image source={{ uri: a.uri }} style={s.thumb} />
                            ) : (
                              <View style={[s.thumb, s.pdfThumb]}>
                                <Text style={{ fontWeight: '800', color: colors.primary }}>PDF</Text>
                              </View>
                            )}
                            {!sent && (
                              <Pressable style={s.x} onPress={() => removeAtt(it, a.id)}>
                                <Text style={{ color: '#fff', fontWeight: '800' }}>×</Text>
                              </Pressable>
                            )}
                          </View>
                        ))}
                      </ScrollView>
                    )}
                    {!sent && (
                      <View style={{ flexDirection: 'row', marginTop: 10, gap: 8 }}>
                        <Button title="촬영" kind="ghost" onPress={() => takePhoto(it)} style={s.mini} />
                        <Button title="앨범" kind="ghost" onPress={() => pickAlbum(it)} style={s.mini} />
                        <Button title="파일" kind="ghost" onPress={() => pickPdf(it)} style={s.mini} />
                      </View>
                    )}
                  </>
                )}

                <Pressable onPress={() => setOpen(open === it.id ? null : it.id)}>
                  <Text style={s.link}>{open === it.id ? '접기' : '어디서 받나요?'}</Text>
                </Pressable>
                {open === it.id && <Text style={s.request}>{it.request}</Text>}
              </View>
            </View>
          );
        })}

        <Text style={s.notice}>
          보험사와 상품에 따라 추가 서류를 요청할 수 있어요. 보내기 전에 보험사 앱이나 고객센터에서 한 번 확인하면
          반려를 줄일 수 있어요.
        </Text>
        <Button title="이 청구 삭제" kind="danger" onPress={confirmDelete} style={{ marginTop: 16 }} />
      </ScrollView>

      {!sent && (
        <View style={s.bottom}>
          {busy ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Button
              title={complete ? '청구 묶음 PDF 만들어 보내기' : `서류 ${p.total - p.done}개 더 필요해요`}
              onPress={makeAndShare}
              disabled={!complete}
            />
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 12 },
  sub: { marginTop: 4, color: colors.sub, fontSize: 13, lineHeight: 19 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  group: { marginTop: 18, fontSize: 14, fontWeight: '800', color: colors.primaryDark },
  check: { fontSize: 20, marginRight: 8, color: colors.sub, fontWeight: '800' },
  itemTitle: { fontSize: 16, fontWeight: '700', color: colors.text, flexShrink: 1, marginRight: 8 },
  hint: { marginTop: 6, color: colors.sub, fontSize: 13, lineHeight: 19 },
  link: { marginTop: 12, color: colors.primary, fontWeight: '700', fontSize: 13 },
  request: { marginTop: 6, color: colors.text, fontSize: 13, lineHeight: 20, backgroundColor: colors.infoBg, padding: 10, borderRadius: 10 },
  thumbWrap: { marginRight: 10 },
  thumb: { width: 72, height: 72, borderRadius: 10, backgroundColor: colors.line },
  pdfThumb: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.infoBg },
  x: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  mini: { flex: 1, paddingVertical: 10 },
  notice: { marginTop: 20, color: colors.sub, fontSize: 12, lineHeight: 18 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 28, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.line },
});
