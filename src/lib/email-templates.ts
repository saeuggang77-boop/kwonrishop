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

export function listingExpiredEmail(name: string, storeName: string): { subject: string; html: string } {
  return {
    subject: "[권리샵] 매물이 만료되었습니다",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #2563eb; font-size: 28px; margin: 0;">권리샵</h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">상가 직거래 플랫폼</p>
        </div>

        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px;">
          <h2 style="color: #111827; font-size: 24px; margin: 0 0 16px;">${name}님</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            등록하신 매물 <strong style="color: #111827;">${storeName}</strong>이(가) 만료되었습니다.
          </p>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
              매물을 계속 노출하시려면 연장하기를 통해 갱신해주세요.
            </p>
          </div>

          <div style="margin: 32px 0;">
            <a href="https://kwonrishop.com/mypage/listings" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              내 매물 관리
            </a>
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

export function newChatMessageEmail(name: string, senderName: string, listingName: string): { subject: string; html: string } {
  return {
    subject: `[권리샵] ${senderName}님이 메시지를 보냈습니다`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #2563eb; font-size: 28px; margin: 0;">권리샵</h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">상가 직거래 플랫폼</p>
        </div>

        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px;">
          <h2 style="color: #111827; font-size: 24px; margin: 0 0 16px;">${name}님</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            <strong style="color: #111827;">${senderName}</strong>님이 <strong style="color: #2563eb;">${listingName}</strong> 관련하여 메시지를 보냈습니다.
          </p>

          <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.6;">
              새로운 메시지가 도착했습니다. 빠른 답변으로 거래 성공률을 높이세요!
            </p>
          </div>

          <div style="margin: 32px 0;">
            <a href="https://kwonrishop.com/chat" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              메시지 확인하기
            </a>
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

export function listingFavoritedEmail(name: string, storeName: string): { subject: string; html: string } {
  return {
    subject: `[권리샵] 매물에 관심을 표시한 사용자가 있습니다`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #2563eb; font-size: 28px; margin: 0;">권리샵</h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">상가 직거래 플랫폼</p>
        </div>

        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px;">
          <h2 style="color: #111827; font-size: 24px; margin: 0 0 16px;">${name}님</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            등록하신 매물 <strong style="color: #111827;">${storeName}</strong>에 관심을 표시한 사용자가 있습니다! 🎉
          </p>

          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="color: #065f46; font-size: 14px; margin: 0; line-height: 1.6;">
              관심이 증가하고 있습니다. 매물 정보를 최신으로 유지하여 더 많은 관심을 받아보세요!
            </p>
          </div>

          <div style="margin: 32px 0;">
            <a href="https://kwonrishop.com/mypage/listings" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              내 매물 관리
            </a>
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
