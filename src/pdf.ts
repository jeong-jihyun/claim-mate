import * as Print from 'expo-print';
import { File } from 'expo-file-system';
import { PDFDocument } from 'pdf-lib';
import { buildChecklist, deadlineOf, toYMD } from './data/documents';
import { bundleFile } from './storage';
import { CLAIMANT_LABEL, Claim, TYPE_LABEL } from './types';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * 청구 묶음 PDF 만들기
 * 1) 첫 장: 청구 요약표 + 서류 체크 결과
 * 2) 이미지 서류: 한 장씩 페이지로 삽입
 * 3) PDF 서류: 뒤에 그대로 이어 붙임
 */
export async function buildBundle(claim: Claim): Promise<string> {
  const items = buildChecklist(claim);

  const rows = items
    .map((it) => {
      const has =
        it.kind === 'check'
          ? !!claim.checks[it.id]
          : (claim.attachments[it.id]?.length ?? 0) > 0;
      const mark = has ? '✔ 준비됨' : it.required ? '✘ 미준비' : '– 선택';
      return `<tr><td>${esc(it.label)}</td><td>${mark}</td></tr>`;
    })
    .join('');

  const imagePages: string[] = [];
  const pdfFiles: File[] = [];
  for (const it of items) {
    for (const att of claim.attachments[it.id] ?? []) {
      if (att.kind === 'image') {
        const b64 = await new File(att.uri).base64();
        imagePages.push(
          `<div class="pg"><h3>${esc(it.label)}</h3><img src="data:image/jpeg;base64,${b64}" /></div>`,
        );
      } else {
        pdfFiles.push(new File(att.uri));
      }
    }
  }

  const deadline = toYMD(deadlineOf(claim.visitDate));
  const html = `<!doctype html><html><head><meta charset="utf-8" />
<style>
body{font-family:-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:#1b1f2a;padding:24px}
h1{font-size:22px;margin:0 0 4px} h3{font-size:15px;margin:0 0 8px}
table{border-collapse:collapse;width:100%;margin-top:10px}
td,th{border:1px solid #d9dde6;padding:8px;font-size:13px;text-align:left}
th{background:#f1f4fa;width:32%}
.pg{page-break-before:always;text-align:center}
.pg img{max-width:100%;max-height:900px}
.note{color:#6b7280;font-size:11px;margin-top:14px}
</style></head><body>
<h1>보험금 청구 요약표</h1>
<div class="note">청구메이트로 정리한 서류 묶음입니다.</div>
<table>
<tr><th>청구권자</th><td>${esc(CLAIMANT_LABEL[claim.claimant])}</td></tr>
<tr><th>보험사</th><td>${esc(claim.insurer)}</td></tr>
<tr><th>청구 유형</th><td>${esc(TYPE_LABEL[claim.type])}</td></tr>
<tr><th>의료기관</th><td>${esc(claim.hospital)}</td></tr>
<tr><th>진료일</th><td>${esc(claim.visitDate)}</td></tr>
<tr><th>청구 금액(본인부담)</th><td>${claim.amount.toLocaleString('ko-KR')}원</td></tr>
<tr><th>청구 기한(3년)</th><td>${deadline}</td></tr>
</table>
<h3 style="margin-top:18px">서류 준비 현황</h3>
<table>${rows}</table>
<div class="note">※ 보험사·상품에 따라 추가 서류를 요청할 수 있습니다. 정식 청구서와 개인(신용)정보 동의서는 보험사 양식으로 작성합니다.</div>
${imagePages.join('')}
</body></html>`;

  const printed = await Print.printToFileAsync({ html });

  // PDF 서류가 없으면 그대로 결과를 사용
  const out = bundleFile(claim.id);
  if (pdfFiles.length === 0) {
    if (out.exists) out.delete();
    await new File(printed.uri).copy(out);
    return out.uri;
  }

  const merged = await PDFDocument.load(await new File(printed.uri).bytes());
  for (const pf of pdfFiles) {
    try {
      const src = await PDFDocument.load(await pf.bytes(), { ignoreEncryption: true });
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
    } catch {
      // 열 수 없는 PDF는 건너뛴다 (화면에서 별도 안내)
    }
  }
  const bytes = await merged.save();
  if (out.exists) out.delete();
  out.create({ overwrite: true });
  await out.write(bytes);
  return out.uri;
}
