import type { Metadata } from "next";
import { Shell } from "../community";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description:
    "SSRRR 스르륵의 Google 로그인, 관리자 Gmail·YouTube 연동, 정보 보관 및 삭제 요청 안내입니다.",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "SSRRR 스르륵 개인정보처리방침", url: "/privacy" },
};

export default function Privacy() {
  return (
    <Shell>
      <article className="about-page">
        <p className="about-kicker">SSRRR · 스르륵</p>
        <h1>개인정보처리방침</h1>
        <p>최종 업데이트: 2026년 10월 10일</p>

        <section>
          <h2>적용 대상과 연락처</h2>
          <p>
            이 안내는 SSRRR 스르륵(www.ssrrr.net)과 Google 인증 화면에 표시되는
            ssrrr 앱의 정보 처리 방식을 설명합니다. Google 로그인은 회원 식별에,
            Gmail과 YouTube 연동은 별도로 연결한 관리자의 콘텐츠 운영에 사용됩니다.
            일반 회원의 Google 로그인에는 Gmail 또는 YouTube 권한이 필요하지 않습니다.
          </p>
          <p>
            개인정보 및 Google 연동 관련 문의·삭제 요청: SSRRR 운영자{" "}
            <a href="mailto:jeonmeensoo@gmail.com">jeonmeensoo@gmail.com</a>
          </p>
        </section>

        <section>
          <h2>Google 로그인과 회원 정보</h2>
          <p>
            Google 로그인 시 openid, email, profile 권한으로 계정 고유 식별자,
            이메일 주소와 이름을 확인합니다. 이 정보를 회원 식별, 로그인, 기존
            계정 연결 및 관리 권한 확인에 사용하고, 서비스의 회원 식별자와 가입
            시각을 함께 저장합니다. Google 계정 비밀번호를 받거나 저장하지 않습니다.
          </p>
          <p>
            사이트에서 설정한 닉네임, 작성한 게시글·댓글, 좋아요, 포인트 및 다운로드
            내역은 회원 식별자와 연결하여 관리합니다. 게시글과 댓글에는 사이트
            닉네임 및 작성 내용이 표시됩니다.
          </p>
          <p>
            로그인 상태를 유지하는 쿠키와 인증 과정 확인용 쿠키를 사용합니다.
            로그인 세션은 14일, 인증 과정 정보는 10분 동안 유효합니다. 서버에는
            로그인 세션 토큰의 해시를 저장하며, 로그아웃하면 해당 세션과 쿠키를
            제거합니다. 로그인 요청 제한을 위해 IP 주소의 해시와 요청 횟수를
            1시간 단위로 기록합니다. 만료된 인증 과정·요청 제한·세션 기록은 후속
            로그인 처리 중 정리됩니다.
          </p>
        </section>

        <section>
          <h2>관리자가 선택하는 Gmail 연동</h2>
          <p>
            관리자가 전용 Gmail 계정을 연결하고 메일 수집을 활성화한 경우
            gmail.modify 권한을 사용합니다. 연결된 메일함 주소와 라벨을 확인하고,
            설정한 수집 라벨 및 허용 발신자에 해당하는 메시지의 식별자, 발신자,
            제목, 본문, 수신 시각과 라벨을 읽습니다. 처리 결과에 따라 완료·검토·오류
            라벨을 생성하거나 변경합니다.
          </p>
          <p>
            제목 등의 수집 조건을 확인한 뒤 선택된 원고의 메시지 식별자, 제목,
            정리된 본문, 수신 시각, 중복 확인용 해시, 검토 결과 및 게시 상태를
            저장합니다. 관리자가 설정한 자동 게시 또는 검토 절차에 따라 경제
            게시판에 제목과 본문이 공개될 수 있습니다. 민감정보 검사는 게시 전
            검토를 돕는 기능이며, 연결할 메일함과 공개할 내용은 관리자가 확인해야 합니다.
          </p>
          <p>
            별도의 ChatGPT 원문 확인 기능을 활성화한 경우, 알림 메일에 포함된
            chatgpt.com 링크를 운영자의 로그인된 브라우저에서 열어 원문을 가져옵니다.
            이 기능은 메일 본문을 AI에 보내 답변을 생성하는 기능이 아닙니다.
          </p>
        </section>

        <section>
          <h2>관리자가 선택하는 YouTube 연동</h2>
          <p>
            관리자가 채널을 연결하면 youtube.upload 권한으로 선택된 영상 파일과
            제목, 설명, 태그, 공개 범위 및 예약 시각을 YouTube에 전송합니다.
            업로드는 관리자의 요청 또는 관리자가 활성화한 자동 업로드 설정에 따라
            실행하며, 비공개·일부 공개·예약·공개 중 선택한 설정을 적용합니다.
          </p>
          <p>
            youtube.readonly 권한은 업로드한 영상의 공개 상태와 조회수, 좋아요 수,
            댓글 수를 확인하는 데 사용합니다. 서비스는 영상·채널 식별자, 업로드
            메타데이터, 업로드 재개 정보, 처리 상태, 시각 및 통계를 저장하여 업로드
            재시도와 운영 현황 확인에 사용합니다. 댓글 수와 댓글 본문은 서로 다른
            정보이며, 이 통계 확인 기능은 댓글 본문을 가져오지 않습니다.
          </p>
        </section>

        <section>
          <h2>저장 위치와 외부 서비스</h2>
          <p>
            사이트 데이터와 영상·첨부 파일은 Cloudflare의 데이터베이스 및 파일
            저장소에서, 메일 수집·영상 제작·업로드는 운영 워커 서버에서 처리합니다.
            관리자용 Google 갱신 토큰은 운영 서버 설정에 저장하여 API 접속에
            사용합니다. Google API 요청과 운영 사이트 간 전송에는 HTTPS를 사용합니다.
          </p>
          <p>
            Google은 로그인 확인, Gmail 처리 및 YouTube 업로드·조회 요청을 처리합니다.
            관리자가 공개하도록 설정한 원고와 영상은 사이트 방문자 또는 YouTube의
            해당 공개 범위에 속하는 이용자가 볼 수 있습니다. 공개 게시와 별도로,
            Google 연동에서 받은 계정 식별정보와 인증 토큰을 광고 설정에 사용하지 않습니다.
          </p>
          <p>
            Google 서비스의 정보 처리에 관한 내용은{" "}
            <a href="https://policies.google.com/privacy?hl=ko">
              Google 개인정보처리방침
            </a>
            에서 확인할 수 있습니다.
          </p>
        </section>

        <section>
          <h2>보관, 연결 해제 및 삭제 요청</h2>
          <p>
            회원 정보, 수신 원고, 영상과 운영 기록은 계정 및 콘텐츠 관리에 사용하며,
            위 로그인 관련 유효기간을 제외한 모든 기록에 공통으로 적용되는 자동
            삭제 기간은 설정되어 있지 않습니다. 관리자의 저장공간 정리 기능과
            데이터 삭제 처리는 별도로 이루어집니다.
          </p>
          <p>
            Google 연동 권한은{" "}
            <a href="https://myaccount.google.com/connections">
              Google 계정의 연결된 앱 관리
            </a>
            에서 ssrrr 앱을 선택하여 해제할 수 있습니다. 사이트에서 로그아웃하면
            현재 사이트 로그인 세션도 종료할 수 있습니다.
          </p>
          <p>
            권한 해제나 로그아웃만으로 사이트에 이미 저장된 정보, 공개된 게시글 또는
            YouTube 영상이 자동 삭제되지는 않습니다. 사이트 저장 정보와 연결 토큰의
            삭제를 요청하려면{" "}
            <a href="mailto:jeonmeensoo@gmail.com">jeonmeensoo@gmail.com</a>
            으로 해당 계정 및 삭제할 정보의 범위를 알려 주세요. 비밀번호나 인증
            토큰을 메일에 포함하지 마세요. YouTube에 게시된 영상은 해당 채널의
            YouTube Studio에서도 직접 관리할 수 있습니다.
          </p>
        </section>

        <section>
          <h2>광고와 외부 콘텐츠의 쿠키</h2>
          <p>
            사이트는 Google AdSense 광고 스크립트를 사용하고 YouTube 영상을
            삽입할 수 있습니다. 이러한 외부 서비스는 광고 제공, 측정, 재생 등의
            목적으로 쿠키 또는 유사한 기술을 사용할 수 있습니다. 이는 위에서
            설명한 회원 로그인 및 관리자 Google API 연동과 별도의 처리입니다.
          </p>
          <p>
            자세한 내용은{" "}
            <a href="https://policies.google.com/technologies/cookies?hl=ko">
              Google의 쿠키 사용 안내
            </a>
            를 참고하고, 광고 관련 선택은{" "}
            <a href="https://myadcenter.google.com/">Google 내 광고 센터</a>
            와 브라우저 설정에서 관리할 수 있습니다. 쿠키를 차단하면 로그인 또는
            외부 콘텐츠 기능이 제한될 수 있습니다.
          </p>
        </section>
      </article>
    </Shell>
  );
}
