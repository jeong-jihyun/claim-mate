export type Claimant = 'self' | 'child' | 'parent';
export type ClaimType = 'outpatient' | 'inpatient' | 'surgery' | 'pharmacy';

export interface Attachment {
  id: string;
  name: string;
  uri: string; // 앱 내부 저장소(복사본)
  kind: 'image' | 'pdf';
}

export interface Claim {
  id: string;
  createdAt: number;
  claimant: Claimant;
  type: ClaimType;
  hospital: string;
  visitDate: string; // YYYY-MM-DD
  amount: number;
  insurer: string;
  attachments: Record<string, Attachment[]>;
  checks: Record<string, boolean>;
  status: 'draft' | 'sent';
  sentAt?: number;
  notifId?: string;
}

export const CLAIMANT_LABEL: Record<Claimant, string> = {
  self: '본인',
  child: '자녀 대신',
  parent: '부모님 대신',
};

export const TYPE_LABEL: Record<ClaimType, string> = {
  outpatient: '통원',
  inpatient: '입원',
  surgery: '수술',
  pharmacy: '약국',
};

export const INSURERS = [
  '삼성화재',
  'DB손해보험',
  '현대해상',
  'KB손해보험',
  '메리츠화재',
  '한화손해보험',
  '롯데손해보험',
  '흥국화재',
  '삼성생명',
  '기타',
];
