// Server-only — Resend email helper
import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not configured");
    _resend = new Resend(key);
  }
  return _resend;
}

interface SendCompletionEmailParams {
  to: string;
  style: string;
  resultUrl: string;
}

export async function sendCompletionEmail(params: SendCompletionEmailParams) {
  const resend = getResend();
  const fromAddress = process.env.RESEND_FROM ?? "찰칵AI <noreply@chalcak.ai>";

  return resend.emails.send({
    from: fromAddress,
    to: params.to,
    subject: "사진이 완성됐어요! — 찰칵AI",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif;max-width:480px;margin:0 auto;padding:32px 20px;">
        <h1 style="font-size:24px;font-weight:800;color:#111;">사진이 완성됐어요!</h1>
        <p style="color:#666;font-size:15px;line-height:1.6;margin-top:12px;">
          요청하신 <strong>${params.style}</strong> 스타일 사진이 준비되었습니다.
          <br/>아래 버튼을 눌러 확인하고 다운로드해보세요.
        </p>
        <a href="${params.resultUrl}"
           style="display:inline-block;margin-top:24px;padding:14px 32px;background:#2563EB;color:#fff;font-weight:700;font-size:16px;border-radius:12px;text-decoration:none;">
          사진 확인하기 &rarr;
        </a>
        <p style="color:#aaa;font-size:12px;margin-top:32px;">
          &copy; 찰칵AI &middot; 이 메일은 사진 생성 완료 알림입니다.
        </p>
      </div>
    `,
  });
}
