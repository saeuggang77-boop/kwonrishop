export function welcomeEmail(params: {
  name: string;
  verifyUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "[권리샵] 이메일 인증을 완료해주세요",
    html: `
      <div style="font-family: 'Noto Sans KR', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1B3A5C; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0;">권리샵</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
          <p>${params.name}님, 권리샵에 가입해주셔서 감사합니다!</p>
          <p>아래 버튼을 클릭하여 이메일 인증을 완료해주세요.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${params.verifyUrl}" style="background: #F59E0B; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 700;">이메일 인증하기</a>
          </div>
          <p style="color: #6B7280; font-size: 13px;">인증 링크는 24시간 동안 유효합니다. 본인이 가입하지 않으셨다면 이 메일을 무시하세요.</p>
        </div>
        <div style="background: #F3F4F6; padding: 15px; text-align: center; font-size: 12px; color: #6B7280;">
          <p>본 메일은 권리샵에서 자동 발송되었습니다.</p>
        </div>
      </div>
    `,
  };
}

export function fraudAlertEmail(params: {
  sellerName: string;
  listingTitle: string;
  ruleDescription: string;
  actionRequired: string;
}): { subject: string; html: string } {
  return {
    subject: `[권리샵] 매물 검증 알림 - "${params.listingTitle}"`,
    html: `
      <div style="font-family: 'Noto Sans KR', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1B3A5C; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0;">권리샵</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
          <p>${params.sellerName}님, 안녕하세요.</p>
          <p>등록하신 매물 <strong>"${params.listingTitle}"</strong>에 대해 검증이 필요합니다.</p>
          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>검출 사유:</strong> ${params.ruleDescription}</p>
          </div>
          <p><strong>조치 사항:</strong> ${params.actionRequired}</p>
          <p>문의사항이 있으시면 고객센터로 연락해 주세요.</p>
        </div>
        <div style="background: #F3F4F6; padding: 15px; text-align: center; font-size: 12px; color: #6B7280;">
          <p>본 메일은 권리샵에서 자동 발송되었습니다.</p>
        </div>
      </div>
    `,
  };
}

export function reportReadyEmail(params: {
  userName: string;
  listingTitle: string;
  downloadUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `[권리샵] 권리 분석 리포트가 준비되었습니다`,
    html: `
      <div style="font-family: 'Noto Sans KR', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1B3A5C; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0;">권리샵</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
          <p>${params.userName}님, 안녕하세요.</p>
          <p><strong>"${params.listingTitle}"</strong>에 대한 권리 분석 리포트가 준비되었습니다.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${params.downloadUrl}" style="background: #F59E0B; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 700;">리포트 다운로드</a>
          </div>
          <p style="color: #6B7280; font-size: 13px;">다운로드 링크는 72시간 동안 유효합니다.</p>
        </div>
        <div style="background: #F3F4F6; padding: 15px; text-align: center; font-size: 12px; color: #6B7280;">
          <p>본 보고서는 참고용이며 법적 효력이 없습니다. 중요한 의사결정 시 전문 법무사 또는 변호사의 검토를 받으시기 바랍니다.</p>
        </div>
      </div>
    `,
  };
}

export function settlementReportEmail(params: {
  sellerName: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: string;
  feeAmount: string;
  netAmount: string;
}): { subject: string; html: string } {
  return {
    subject: `[권리샵] ${params.periodStart}~${params.periodEnd} 정산 안내`,
    html: `
      <div style="font-family: 'Noto Sans KR', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1B3A5C; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0;">권리샵</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
          <p>${params.sellerName}님, 안녕하세요.</p>
          <p>${params.periodStart} ~ ${params.periodEnd} 기간의 정산 내역을 안내드립니다.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 10px;">총 거래액</td>
              <td style="padding: 10px; text-align: right; font-weight: 700;">${params.totalAmount}</td>
            </tr>
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 10px;">플랫폼 수수료</td>
              <td style="padding: 10px; text-align: right; color: #EF4444;">-${params.feeAmount}</td>
            </tr>
            <tr style="background: #EFF4F9;">
              <td style="padding: 10px; font-weight: 700;">정산 금액</td>
              <td style="padding: 10px; text-align: right; font-weight: 700; color: #1B3A5C;">${params.netAmount}</td>
            </tr>
          </table>
          <p style="color: #6B7280; font-size: 13px;">세금계산서는 별도로 발행됩니다.</p>
        </div>
        <div style="background: #F3F4F6; padding: 15px; text-align: center; font-size: 12px; color: #6B7280;">
          <p>본 메일은 권리샵에서 자동 발송되었습니다.</p>
        </div>
      </div>
    `,
  };
}
