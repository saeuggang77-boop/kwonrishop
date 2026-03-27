"use client";

import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder: 실제로는 API 호출
    alert("문의가 접수되었습니다. 빠른 시일 내에 답변 드리겠습니다.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">고객센터</h1>
          <p className="text-gray-600 dark:text-gray-400">
            궁금하신 사항이나 문제가 있으시면 언제든지 문의해주세요
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Contact Info */}
          <div className="space-y-6">
            {/* Operating Hours */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">운영시간</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    평일: 09:00 - 18:00
                    <br />
                    주말 및 공휴일: 휴무
                    <br />
                    점심시간: 12:00 - 13:00
                  </p>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">전화 문의</h3>
                  <a
                    href="tel:1234-5678"
                    className="text-blue-600 dark:text-blue-400 hover:underline text-lg font-semibold"
                  >
                    1234-5678
                  </a>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    운영시간 내 연결 가능합니다
                  </p>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">이메일 문의</h3>
                  <a
                    href="mailto:support@kwonrishop.com"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    support@kwonrishop.com
                  </a>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    영업일 기준 24시간 내 답변
                  </p>
                </div>
              </div>
            </div>

            {/* KakaoTalk */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 01-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3zm5.907 8.06l1.47-1.424a.472.472 0 00-.656-.678l-1.928 1.866V9.282a.472.472 0 00-.944 0v2.557a.471.471 0 000 .222V13.5a.472.472 0 00.944 0v-1.363l.427-.413 1.428 2.033a.472.472 0 00.773-.543l-1.514-2.155zm-2.958 1.924h-1.46V9.297a.472.472 0 00-.943 0v4.159c0 .26.21.472.471.472h1.932a.472.472 0 000-.944zm-5.857 0h-1.46V9.297a.472.472 0 00-.943 0v4.159c0 .26.21.472.471.472h1.932a.472.472 0 000-.944zm-2.828-4.157a.472.472 0 00-.472-.472h-1.93a.472.472 0 000 .944h.729v3.715a.472.472 0 00.944 0V9.299h.729a.472.472 0 00.471-.472z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
                    카카오톡 채널
                  </h3>
                  <a
                    href="https://pf.kakao.com/_권리샵"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    @권리샵
                  </a>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    실시간 채팅 상담 가능
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ Link */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                자주 묻는 질문
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                문의 전에 자주 묻는 질문을 확인해보세요
              </p>
              <a
                href="/faq"
                className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                FAQ 보러가기
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              문의하기
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="홍길동"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="문의 제목을 입력하세요"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:bg-gray-700 dark:text-gray-100"
                  placeholder="문의 내용을 자세히 작성해주세요"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                문의 제출하기
              </button>
            </form>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
              영업일 기준 24시간 내에 답변 드리겠습니다
            </p>
          </div>
        </div>

        {/* Company Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
            회사 정보
          </h2>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div className="flex">
              <span className="font-semibold text-gray-700 dark:text-gray-300 w-32">
                회사명
              </span>
              <span className="text-gray-600 dark:text-gray-400">주식회사 권리샵</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 dark:text-gray-300 w-32">
                대표이사
              </span>
              <span className="text-gray-600 dark:text-gray-400">[대표자명]</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 dark:text-gray-300 w-32">
                사업자등록번호
              </span>
              <span className="text-gray-600 dark:text-gray-400">[000-00-00000]</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 dark:text-gray-300 w-32">
                통신판매업
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                제0000-서울강남-00000호
              </span>
            </div>
            <div className="flex md:col-span-2">
              <span className="font-semibold text-gray-700 dark:text-gray-300 w-32">주소</span>
              <span className="text-gray-600 dark:text-gray-400">
                서울특별시 강남구 [상세주소]
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
