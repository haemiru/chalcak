import Link from "next/link";

export const metadata = {
  title: "이용약관 | 찰칵AI",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-gray-100 px-5 pt-12 pb-6 md:pt-16">
        <div className="mx-auto max-w-2xl">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
            &larr; 홈으로
          </Link>
          <h1 className="mt-3 text-2xl font-bold md:text-3xl">이용약관</h1>
          <p className="mt-1 text-sm text-gray-400">시행일: 2026년 3월 1일</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8 text-sm leading-relaxed text-gray-700 [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-gray-900 [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:font-semibold [&_h3]:text-gray-800 [&_p]:mb-3 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5">
        <h2>제1조 (목적)</h2>
        <p>
          본 약관은 찰칵AI(이하 &quot;회사&quot;)가 제공하는 AI 사진 생성 서비스(이하 &quot;서비스&quot;)의
          이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>

        <h2>제2조 (정의)</h2>
        <ol>
          <li>&quot;서비스&quot;란 이용자가 업로드한 사진을 기반으로 AI 모델을 학습하고, 다양한 스타일의 프로필 사진을 생성하는 서비스를 말합니다.</li>
          <li>&quot;이용자&quot;란 본 약관에 따라 서비스를 이용하는 자를 말합니다.</li>
          <li>&quot;크레딧&quot;이란 사진 생성에 사용되는 서비스 내 이용 단위를 말합니다.</li>
          <li>&quot;모델 학습&quot;이란 이용자의 사진을 AI에 학습시켜 개인화된 모델을 생성하는 과정을 말합니다.</li>
        </ol>

        <h2>제3조 (약관의 효력 및 변경)</h2>
        <ol>
          <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력을 발생합니다.</li>
          <li>회사는 관련 법령을 위반하지 않는 범위 내에서 약관을 변경할 수 있으며, 변경 시 적용일 7일 전부터 공지합니다.</li>
        </ol>

        <h2>제4조 (서비스의 내용)</h2>
        <ol>
          <li>AI 모델 학습: 이용자가 업로드한 사진(최소 8장, 최대 15장)을 기반으로 AI 모델을 생성합니다.</li>
          <li>사진 생성: 증명사진, 정장 프로필, 카카오톡 프로필, 인스타그램 프로필 등 다양한 스타일의 사진을 생성합니다.</li>
          <li>생성된 사진의 저작권은 이용자에게 있습니다.</li>
        </ol>

        <h2>제5조 (이용 요금 및 결제)</h2>
        <ol>
          <li>서비스 요금은 다음과 같습니다:
            <ul>
              <li>체험: 2,900원 (4장 생성, 모델 학습 1회)</li>
              <li>베이직: 월 7,900원 (월 20장 생성, 모델 학습 월 1회)</li>
              <li>프로: 월 14,900원 (월 52장 생성, 모델 학습 월 2회)</li>
              <li>프리미엄: 월 39,900원 (월 100장 생성, 모델 학습 월 3회)</li>
            </ul>
          </li>
          <li>결제는 토스페이먼츠를 통해 처리되며, 구독 플랜은 매월 자동 결제됩니다.</li>
          <li>미사용 크레딧은 다음 달로 이월되지 않습니다.</li>
        </ol>

        <h2>제6조 (환불 정책)</h2>
        <ol>
          <li>AI 모델 학습 시작 전: 전액 환불</li>
          <li>AI 모델 학습 시작 후: 환불 불가 (남은 크레딧으로 전환)</li>
          <li>증명사진 규격 불합격 시: 전액 환불</li>
          <li>구독 해지: 다음 결제일부터 적용되며, 이미 결제된 기간은 정상 이용 가능합니다.</li>
        </ol>

        <h2>제7조 (이용자의 의무)</h2>
        <ol>
          <li>이용자는 본인의 사진만 업로드해야 하며, 타인의 사진을 무단으로 사용할 수 없습니다.</li>
          <li>서비스를 통해 생성된 사진을 불법적인 목적으로 사용할 수 없습니다.</li>
          <li>서비스의 기술적 보호 조치를 우회하거나 방해하는 행위를 할 수 없습니다.</li>
        </ol>

        <h2>제8조 (개인정보 및 사진 데이터 처리)</h2>
        <ol>
          <li>업로드된 원본 사진은 AI 모델 학습 완료 후 즉시 서버에서 삭제됩니다.</li>
          <li>생성된 사진은 이용자의 대시보드에 보관되며, 이용자가 직접 삭제할 수 있습니다.</li>
          <li>개인정보 처리에 관한 자세한 사항은 개인정보처리방침을 참조하시기 바랍니다.</li>
        </ol>

        <h2>제9조 (서비스 제한 및 중단)</h2>
        <ol>
          <li>회사는 시스템 점검, 장애 발생 등 불가피한 사유로 서비스를 일시 중단할 수 있습니다.</li>
          <li>다음 각 호에 해당하는 경우 서비스 이용을 제한할 수 있습니다:
            <ul>
              <li>타인의 사진을 무단으로 업로드한 경우</li>
              <li>불법적인 목적으로 서비스를 이용한 경우</li>
              <li>서비스 운영을 방해한 경우</li>
            </ul>
          </li>
        </ol>

        <h2>제10조 (면책 조항)</h2>
        <ol>
          <li>AI 기술의 특성상 생성된 사진의 품질은 업로드된 사진의 품질과 수량에 따라 달라질 수 있으며, 회사는 특정 품질을 보장하지 않습니다.</li>
          <li>이용자의 귀책사유로 인한 서비스 이용 장애에 대해 회사는 책임을 지지 않습니다.</li>
        </ol>

        <h2>제11조 (분쟁 해결)</h2>
        <p>
          서비스 이용과 관련하여 분쟁이 발생한 경우, 회사와 이용자는 분쟁 해결을 위해 성실히 협의합니다.
          협의가 이루어지지 않을 경우 관할 법원은 회사의 소재지를 관할하는 법원으로 합니다.
        </p>

        <div className="mt-12 rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500">
          <p>문의사항이 있으시면 <Link href="/support" className="text-primary hover:underline">고객센터</Link>로 연락해 주세요.</p>
        </div>
      </main>
    </div>
  );
}
