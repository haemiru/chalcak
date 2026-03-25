/**
 * 카카오톡 나에게 보내기 API
 * https://developers.kakao.com/docs/latest/ko/kakaotalk-message/rest-api#default-template-msg-me
 */

interface SendKakaoMessageParams {
  accessToken: string;
  style: string;
  resultUrl: string;
}

const STYLE_LABELS: Record<string, string> = {
  "id-photo": "증명사진",
  suit: "정장 프로필",
  kakao: "카카오톡 프로필",
  instagram: "인스타 프로필",
};

export async function sendKakaoMessage({
  accessToken,
  style,
  resultUrl,
}: SendKakaoMessageParams): Promise<boolean> {
  const styleLabel = STYLE_LABELS[style] ?? style;

  // 기본 텍스트 템플릿 사용
  const templateObject = {
    object_type: "text",
    text: `찰칵AI - ${styleLabel} 사진이 완성되었습니다!\n지금 바로 확인하고 다운로드하세요.`,
    link: {
      web_url: resultUrl,
      mobile_web_url: resultUrl,
    },
    button_title: "사진 확인하기",
  };

  const res = await fetch(
    "https://kapi.kakao.com/v2/api/talk/memo/default/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      body: `template_object=${encodeURIComponent(JSON.stringify(templateObject))}`,
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Kakao message error (${res.status}):`, errorText);
    return false;
  }

  return true;
}
