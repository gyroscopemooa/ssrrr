import type { Metadata } from "next";
import { Shell } from "../community";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "SSRRR 스르륵 개인정보처리방침입니다.",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "SSRRR 스르륵 개인정보처리방침", url: "/privacy" },
};

export default function Privacy() {
  return (
    <Shell>
      <article className="about-page">
        <p className="about-kicker">SSRRR · 스르륵</p>
        <h1>개인정보처리방침</h1>
        <p>최종 업데이트: 2026년 10월 18일</p>

        <section>
          <h2>개인정보 보호 원칙</h2>
          <p>
            SSRRR 스르륵은 이용자의 개인정보를 소중하게 생각하며, 관련 법령을
            준수하여 필요한 범위에서만 개인정보를 처리합니다.
          </p>
        </section>

        <section>
          <h2>개인정보의 이용</h2>
          <p>
            개인정보는 서비스 제공, 이용자 문의 대응, 서비스의 안전한 운영을 위해
            이용하며, 정해진 목적 이외의 용도로 사용하지 않습니다.
          </p>
        </section>

        <section>
          <h2>개인정보의 보호 및 삭제</h2>
          <p>
            개인정보가 안전하게 관리되도록 합리적인 보호 조치를 적용합니다. 이용
            목적이 달성되거나 보관할 필요가 없어진 개인정보는 관련 법령에 따라
            안전하게 삭제합니다.
          </p>
        </section>

        <section>
          <h2>이용자의 권리</h2>
          <p>
            이용자는 자신의 개인정보에 대한 열람, 정정, 삭제 및 처리 정지를 요청할
            수 있습니다. 요청은 본인 확인 후 관련 법령에 따라 처리합니다.
          </p>
        </section>

        <section>
          <h2>문의</h2>
          <p>
            개인정보와 관련한 문의 또는 요청은{" "}
            <a href="mailto:support@live-sub.com">support@live-sub.com</a>으로
            보내 주세요.
          </p>
        </section>
      </article>
    </Shell>
  );
}
