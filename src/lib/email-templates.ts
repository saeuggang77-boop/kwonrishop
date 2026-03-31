export function welcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: "권리샵에 오신 것을 환영합니다!",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #2563eb; font-size: 28px; margin: 0;">권리샵</h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">상가 직거래 플랫폼</p>
        </div>

        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px;">
          <h2 style="color: #111827; font-size: 24px; margin: 0 0 16px;">환영합니다, ${name}님!</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            권리샵은 상가 권리금 직거래를 위한 안전하고 편리한 플랫폼입니다.<br>
            수수료 없이 안전하게 거래하세요.
          </p>

          <div style="margin: 32px 0;">
            <a href="https://kwonrishop.com/listings" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              매물 둘러보기
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px;">
            <h3 style="color: #111827; font-size: 18px; margin: 0 0 12px;">주요 기능</h3>
            <ul style="color: #4b5563; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>수수료 없는 직거래</li>
              <li>실시간 채팅</li>
              <li>안전한 에스크로 결제</li>
              <li>사업자 인증 시스템</li>
            </ul>
          </div>
        </div>

        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} 권리샵. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };
}

export function emailVerificationEmail(name: string, verifyUrl: string): { subject: string; html: string } {
  return {
    subject: "[권리샵] 이메일 인증을 완료해주세요",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #2563eb; font-size: 28px; margin: 0;">권리샵</h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">상가 직거래 플랫폼</p>
        </div>

        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px;">
          <h2 style="color: #111827; font-size: 24px; margin: 0 0 16px;">${name}님, 이메일 인증을 완료해주세요</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            권리샵 회원가입을 위해 아래 버튼을 클릭하여 이메일 인증을 완료해주세요.
          </p>

          <div style="margin: 32px 0; text-align: center;">
            <a href="${verifyUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              이메일 인증하기
            </a>
          </div>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
              이 링크는 24시간 동안 유효합니다. 만료된 경우 로그인 페이지에서 인증 메일을 재발송할 수 있습니다.
            </p>
          </div>

          <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 24px 0 0;">
            본인이 가입을 요청하지 않았다면 이 메일을 무시하세요.
          </p>
        </div>

        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} 권리샵. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };
}

export function passwordResetEmail(name: string, resetUrl: string): { subject: string; html: string } {
  return {
    subject: "[권리샵] 비밀번호 재설정",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #2563eb; font-size: 28px; margin: 0;">권리샵</h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">상가 직거래 플랫폼</p>
        </div>

        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px;">
          <h2 style="color: #111827; font-size: 24px; margin: 0 0 16px;">${name}님, 비밀번호를 재설정하세요</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            비밀번호 재설정이 요청되었습니다. 아래 버튼을 클릭하여 새 비밀번호를 설정하세요.
          </p>

          <div style="margin: 32px 0; text-align: center;">
            <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              비밀번호 재설정하기
            </a>
          </div>

          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="color: #991b1b; font-size: 14px; margin: 0; line-height: 1.6;">
              이 링크는 1시간 동안 유효합니다. 본인이 요청하지 않았다면 이 메일을 무시하세요. 비밀번호는 변경되지 않습니다.
            </p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} 권리샵. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };
}
