import Link from "next/link";

export const metadata = {
  title: "개인정보처리방침 | 찰칵AI",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-gray-100 px-5 pt-12 pb-6 md:pt-16">
        <div className="mx-auto max-w-2xl">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
            &larr; 홈으로
          </Link>
          <h1 className="mt-3 text-2xl font-bold md:text-3xl">개인정보처리방침</h1>
          <p className="mt-1 text-sm text-gray-400">시행일: 2026년 3월 1일</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8 text-sm leading-relaxed text-gray-700 [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-gray-900 [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:font-semibold [&_h3]:text-gray-800 [&_p]:mb-3 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5">
        <p>
          찰칵AI(이하 &quot;회사&quot;)는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」을 준수합니다.
          본 개인정보처리방침은 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며,
          어떠한 보호 조치가 취해지고 있는지 알려드립니다.
        </p>

        <h2>1. 수집하는 개인정보 항목</h2>
        <h3>필수 항목</h3>
        <ul>
          <li>이메일 주소 (회원가입 및 로그인)</li>
          <li>결제 정보 (토스페이먼츠를 통한 결제 처리)</li>
        </ul>
        <h3>서비스 이용 시 수집</h3>
        <ul>
          <li>얼굴 사진 (AI 모델 학습 목적, 학습 완료 후 즉시 삭제)</li>
          <li>서비스 이용 기록, 접속 로그, 기기 정보</li>
        </ul>

        <h2>2. 개인정보 수집 및 이용 목적</h2>
        <ul>
          <li>회원 관리: 본인 확인, 서비스 이용 관리</li>
          <li>서비스 제공: AI 모델 학습, 사진 생성, 결과물 제공</li>
          <li>결제 처리: 서비스 요금 결제 및 환불</li>
          <li>서비스 개선: 이용 통계 분석, 서비스 품질 향상</li>
          <li>고객 지원: 문의 응대, 불만 처리</li>
        </ul>

        <h2>3. 얼굴 사진(생체 정보) 처리</h2>
        <p>
          회사는 이용자의 얼굴 사진을 특별히 신중하게 처리합니다:
        </p>
        <ul>
          <li>업로드된 원본 사진은 AI 모델 학습이 완료되는 즉시 서버에서 영구 삭제됩니다.</li>
          <li>학습된 AI 모델은 이용자의 계정에 귀속되며, 타인에게 공유되지 않습니다.</li>
          <li>생성된 결과 사진은 이용자만 접근 가능하며, 이용자가 직접 삭제할 수 있습니다.</li>
          <li>회사는 이용자의 사진을 마케팅, 광고 또는 기타 목적으로 사용하지 않습니다.</li>
        </ul>

        <h2>4. 개인정보 보유 및 이용 기간</h2>
        <ul>
          <li>원본 사진: AI 모델 학습 완료 즉시 삭제</li>
          <li>회원 정보: 회원 탈퇴 시까지 (탈퇴 후 즉시 삭제)</li>
          <li>결제 기록: 전자상거래법에 따라 5년 보관</li>
          <li>접속 로그: 통신비밀보호법에 따라 3개월 보관</li>
        </ul>

        <h2>5. 개인정보의 제3자 제공</h2>
        <p>
          회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
          다만, 아래의 경우에는 예외로 합니다:
        </p>
        <ul>
          <li>이용자가 사전에 동의한 경우</li>
          <li>법령의 규정에 의하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
        </ul>

        <h2>6. 개인정보 처리 위탁</h2>
        <ul>
          <li>결제 처리: 토스페이먼츠 (주식회사 비바리퍼블리카)</li>
          <li>AI 모델 학습 및 이미지 생성: Astria.ai</li>
          <li>이메일 발송: Resend</li>
          <li>호스팅: Vercel, Supabase</li>
        </ul>

        <h2>7. 이용자의 권리</h2>
        <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다:</p>
        <ul>
          <li>개인정보 열람 요구</li>
          <li>오류 등이 있을 경우 정정 요구</li>
          <li>삭제 요구</li>
          <li>처리 정지 요구</li>
        </ul>
        <p>위 권리 행사는 고객센터를 통해 요청하실 수 있습니다.</p>

        <h2>8. 개인정보 보호 조치</h2>
        <ul>
          <li>데이터 암호화: 전송 구간 SSL/TLS 암호화, 저장 시 암호화</li>
          <li>접근 제한: 개인정보 접근 권한을 최소한의 인원으로 제한</li>
          <li>Row Level Security: 데이터베이스 수준에서 이용자 본인의 데이터만 접근 가능</li>
          <li>원본 사진 즉시 삭제: AI 학습 완료 후 복구 불가능하게 삭제</li>
        </ul>

        <h2>9. 개인정보 보호책임자</h2>
        <ul>
          <li>이메일: support@chalcak.ai</li>
        </ul>

        <h2>10. 방침 변경</h2>
        <p>
          본 개인정보처리방침이 변경되는 경우, 시행일 7일 전부터 서비스 내 공지사항을 통해 안내합니다.
        </p>

        <div className="mt-12 rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500">
          <p>문의사항이 있으시면 <Link href="/support" className="text-primary hover:underline">고객센터</Link>로 연락해 주세요.</p>
        </div>
      </main>
    </div>
  );
}
