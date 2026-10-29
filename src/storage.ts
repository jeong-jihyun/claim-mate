import { Directory, File, Paths } from 'expo-file-system';
import { Attachment, Claim } from './types';

// 진료정보는 민감정보라서 서버로 보내지 않고 이 기기 안에만 저장한다.
const root = new Directory(Paths.document, 'claimmate');
const dataFile = () => new File(root, 'claims.json');

function ensureRoot() {
  if (!root.exists) root.create({ intermediates: true, idempotent: true });
}

export async function loadClaims(): Promise<Claim[]> {
  try {
    ensureRoot();
    const f = dataFile();
    if (!f.exists) return [];
    const text = await f.text();
    const list = JSON.parse(text) as Claim[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function saveClaims(claims: Claim[]): Promise<void> {
  ensureRoot();
  const f = dataFile();
  if (!f.exists) f.create({ overwrite: true });
  await f.write(JSON.stringify(claims));
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** 선택/촬영한 파일을 앱 저장소로 복사한다. */
export async function importAttachment(
  claimId: string,
  srcUri: string,
  name: string,
  kind: Attachment['kind'],
): Promise<Attachment> {
  ensureRoot();
  const dir = new Directory(root, claimId);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  const id = newId();
  const ext = kind === 'pdf' ? 'pdf' : 'jpg';
  const dest = new File(dir, `${id}.${ext}`);
  await new File(srcUri).copy(dest);
  return { id, name, uri: dest.uri, kind };
}

export function removeFile(uri: string) {
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    /* 이미 없는 파일은 무시 */
  }
}

export function removeClaimFiles(claimId: string) {
  try {
    const dir = new Directory(root, claimId);
    if (dir.exists) dir.delete();
  } catch {
    /* ignore */
  }
}

export function bundleFile(claimId: string): File {
  ensureRoot();
  const dir = new Directory(root, claimId);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return new File(dir, `claim-bundle.pdf`);
}
