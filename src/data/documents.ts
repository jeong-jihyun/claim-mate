import { Claim, ClaimType, Claimant } from '../types';

/**
 * 서류 요건 규칙 (벤치마킹/조사 결과 반영)
 * - 공통: 청구서, 개인(신용)정보 동의, 신분증, 통장 사본, 진료비 영수증·세부내역서
 * - 통원: 진단서·통원확인서·처방전 등 중 1개
 * - 입원: 진단서 또는 입퇴원확인서
 * - 수술: 수술확인서 또는 진단서
 * - 약국: 질병분류기호가 적힌 처방전 + 약제비 영수증
 * ※ 보험사·상품마다 다를 수 있어 "보험사 확인" 문구를 화면에 함께 보여 준다.
 */
export interface DocItem {
  id: string;
  label: string;
  hint: string; // 짧은 설명
  request: string; // 어디서 어떻게 받는지
  kind: 'file' | 'check';
  required: boolean;
  group?: string; // 같은 group 안에서는 1개만 있으면 충족
  groupLabel?: string;
}

const common = (type: ClaimType): DocItem[] => {
  const items: DocItem[] = [
    {
      id: 'idcard',
      label: '신분증 사본',
      hint: '보험금을 받는 사람(청구권자)의 신분증 앞면',
      request: '내 신분증을 앞면만 촬영해요.',
      kind: 'file',
      required: true,
    },
    {
      id: 'bankbook',
      label: '통장 사본',
      hint: '보험금을 받을 계좌 (본인 명의)',
      request: '통장 표지 또는 은행 앱의 계좌 화면을 캡처해요.',
      kind: 'file',
      required: true,
    },
  ];
  if (type === 'pharmacy') {
    items.push(
      {
        id: 'rx_receipt',
        label: '약제비 영수증',
        hint: '카드 영수증이 아니라 약국에서 주는 약제비 계산서·영수증',
        request: '약국 수납 때 "실손보험 청구용 약제비 영수증 주세요"라고 말해요.',
        kind: 'file',
        required: true,
      },
      {
        id: 'rx',
        label: '처방전',
        hint: '질병분류기호(질병코드)가 적힌 처방전',
        request: '병원에서 처방전을 받을 때 질병코드가 적혀 있는지 확인해요. 이미 약을 탔다면 약국에 사본을 요청해요.',
        kind: 'file',
        required: true,
      },
    );
  } else {
    items.push(
      {
        id: 'receipt',
        label: '진료비 계산서·영수증',
        hint: '병원 양식 원본. 카드 결제 영수증은 심사가 안 돼요',
        request: '병원 수납 창구에서 "실손보험 청구용 진료비 계산서·영수증 주세요"라고 말해요.',
        kind: 'file',
        required: true,
      },
      {
        id: 'detail',
        label: '진료비 세부내역서',
        hint: '급여/비급여가 나뉜 항목별 내역. 가장 많이 빠뜨리는 서류예요',
        request: '수납 창구에서 영수증과 함께 "진료비 세부내역서도 같이 주세요"라고 말해요.',
        kind: 'file',
        required: true,
      },
    );
  }
  return items;
};

const proof = (type: ClaimType): DocItem[] => {
  switch (type) {
    case 'outpatient':
      return [
        {
          id: 'p_visit',
          label: '통원확인서',
          hint: '진단명과 통원일자가 적힌 확인서',
          request: '원무과(수납 창구)에서 발급해요. 발급 수수료가 있을 수 있어요.',
          kind: 'file',
          required: true,
          group: 'g_outpatient',
          groupLabel: '통원 증빙 (아래 중 1개)',
        },
        {
          id: 'p_diag',
          label: '진단서',
          hint: '진단명(질병분류코드)·진단일자 포함',
          request: '진단서는 의사가 새로 작성하는 서류예요. 진료 때 의사에게 요청하고 원무과에서 받아요.',
          kind: 'file',
          required: true,
          group: 'g_outpatient',
          groupLabel: '통원 증빙 (아래 중 1개)',
        },
        {
          id: 'p_rx',
          label: '처방전',
          hint: '질병분류기호가 적힌 처방전',
          request: '처방전을 받을 때 질병코드가 적혀 있는지 확인해요.',
          kind: 'file',
          required: true,
          group: 'g_outpatient',
          groupLabel: '통원 증빙 (아래 중 1개)',
        },
      ];
    case 'inpatient':
      return [
        {
          id: 'in_cert',
          label: '입퇴원확인서',
          hint: '입원 기간과 진단명(질병코드)이 적힌 확인서',
          request: '퇴원 수속 때 원무과에서 발급해요.',
          kind: 'file',
          required: true,
          group: 'g_inpatient',
          groupLabel: '입원 증빙 (아래 중 1개)',
        },
        {
          id: 'in_diag',
          label: '진단서',
          hint: '진단명(질병분류코드)·입원기간 포함. 청구액이 크면 요구될 수 있어요',
          request: '퇴원 전에 의사에게 요청하고 원무과에서 받아요.',
          kind: 'file',
          required: true,
          group: 'g_inpatient',
          groupLabel: '입원 증빙 (아래 중 1개)',
        },
      ];
    case 'surgery':
      return [
        {
          id: 'sx_cert',
          label: '수술확인서',
          hint: '수술명과 수술일자가 적힌 확인서',
          request: '퇴원 수속 때 원무과에서 발급해요.',
          kind: 'file',
          required: true,
          group: 'g_surgery',
          groupLabel: '수술 증빙 (아래 중 1개)',
        },
        {
          id: 'sx_diag',
          label: '진단서',
          hint: '수술명·수술일자 포함',
          request: '의사에게 요청하고 원무과에서 받아요.',
          kind: 'file',
          required: true,
          group: 'g_surgery',
          groupLabel: '수술 증빙 (아래 중 1개)',
        },
        {
          id: 'sx_stay',
          label: '입퇴원확인서 (입원했다면)',
          hint: '수술로 입원했다면 함께 내요',
          request: '퇴원 수속 때 원무과에서 발급해요.',
          kind: 'file',
          required: false,
        },
      ];
    default:
      return [];
  }
};

const proxyItems = (claimant: Claimant): DocItem[] => {
  if (claimant === 'parent') {
    return [
      {
        id: 'proxy',
        label: '위임장·동의서 (보험사 양식)',
        hint: '부모님이 직접 못 하는 경우 대신 청구할 때 필요해요',
        request: '보험사 홈페이지 또는 고객센터에서 양식을 받아 부모님 서명을 받아요.',
        kind: 'file',
        required: true,
      },
    ];
  }
  if (claimant === 'child') {
    return [
      {
        id: 'family',
        label: '가족관계증명서',
        hint: '미성년 자녀를 대신해 청구할 때 보험사가 요구할 수 있어요',
        request: '정부24 또는 주민센터에서 발급해요. 필요 여부는 보험사에 확인해요.',
        kind: 'file',
        required: false,
      },
    ];
  }
  return [];
};

export function buildChecklist(claim: Pick<Claim, 'type' | 'claimant'>): DocItem[] {
  const checks: DocItem[] = [
    {
      id: 'consent',
      label: '보험금 청구서·개인(신용)정보 동의서 작성',
      hint: '보험사 청구서와 필수 동의서를 작성했어요 (보험사 앱/전달 단계에서 작성)',
      request: '이 앱의 "청구 요약표"가 첫 장에 들어가요. 정식 청구서와 동의서는 보험사 앱·양식으로 작성해요.',
      kind: 'check',
      required: true,
    },
  ];
  if (claim.type !== 'pharmacy') {
    checks.push({
      id: 'notcard',
      label: '영수증은 카드전표가 아니라 병원 발급 원본이에요',
      hint: '카드 영수증에는 비급여 세부 항목이 없어 심사가 안 돼요',
      request: '병원 양식의 진료비 계산서·영수증을 받으세요.',
      kind: 'check',
      required: true,
    });
  }
  return [
    ...common(claim.type),
    ...proof(claim.type),
    ...proxyItems(claim.claimant),
    ...checks,
  ];
}

export interface Progress {
  done: number;
  total: number;
  missing: string[];
}

export function getProgress(claim: Claim): Progress {
  const items = buildChecklist(claim);
  const seenGroups = new Set<string>();
  let done = 0;
  let total = 0;
  const missing: string[] = [];
  for (const it of items) {
    if (!it.required) continue;
    const has =
      it.kind === 'check'
        ? !!claim.checks[it.id]
        : (claim.attachments[it.id]?.length ?? 0) > 0;
    if (it.group) {
      if (seenGroups.has(it.group)) continue;
      seenGroups.add(it.group);
      total += 1;
      const groupHas = items
        .filter((x) => x.group === it.group)
        .some((x) => (claim.attachments[x.id]?.length ?? 0) > 0);
      if (groupHas) done += 1;
      else missing.push(it.groupLabel ?? it.label);
    } else {
      total += 1;
      if (has) done += 1;
      else missing.push(it.label);
    }
  }
  return { done, total, missing };
}

/** 청구권 소멸시효: 진료일로부터 3년 */
export function deadlineOf(visitDate: string): Date {
  const d = new Date(visitDate + 'T00:00:00');
  d.setFullYear(d.getFullYear() + 3);
  return d;
}

export function daysLeft(visitDate: string, now = new Date()): number {
  const ms = deadlineOf(visitDate).getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/** 로컬 날짜를 YYYY-MM-DD로 바꾼다 (toISOString은 UTC라 한국에서 하루 어긋남) */
export function toYMD(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00');
  return !isNaN(d.getTime()) && toYMD(d) === s;
}
