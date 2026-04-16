"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 클라이언트 검증
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      toast.error("모든 필드를 입력해주세요.");
      return;
    }

    if (formData.name.length > 50) {
      toast.error("이름은 50자 이내로 입력해주세요.");
      return;
    }

    if (formData.subject.length > 200) {
      toast.error("제목은 200자 이내로 입력해주세요.");
      return;
    }

    if (formData.message.length > 5000) {
      toast.error("내용은 5000자 이내로 입력해주세요.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "문의 접수에 실패했습니다.");
        return;
      }

      toast.success("문의가 접수되었습니다. 빠른 시일 내에 답변 드리겠습니다.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error("Contact form error:", error);
      toast.error("문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">고객센터</h1>
          <p className="text-gray-600">
            궁금하신 사항이나 문제가 있으시면 언제든지 문의해주세요
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Contact Info */}
          <div className="space-y-6">
            {/* Operating Hours */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-green-700"
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
                  <h3 className="font-bold text-gray-900 mb-2">운영시간</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
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
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-green-600"
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
                  <h3 className="font-bold text-gray-900 mb-2">전화 문의</h3>
                  <a
                    href="tel:1588-7928"
                    className="text-green-700 hover:underline text-lg font-semibold"
                  >
                    1588-7928
                  </a>
                  <p className="text-gray-600 text-sm mt-1">
                    운영시간 내 연결 가능합니다
                  </p>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-green-600"
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
                  <h3 className="font-bold text-gray-900 mb-2">이메일 문의</h3>
                  <a
                    href="mailto:samsungcu@naver.com"
                    className="text-green-700 hover:underline font-medium"
                  >
                    samsungcu@naver.com
                  </a>
                  <p className="text-gray-600 text-sm mt-1">
                    영업일 기준 24시간 내 답변
                  </p>
                </div>
              </div>
            </div>

            {/* KakaoTalk */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-yellow-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 01-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3zm5.907 8.06l1.47-1.424a.472.472 0 00-.656-.678l-1.928 1.866V9.282a.472.472 0 00-.944 0v2.557a.471.471 0 000 .222V13.5a.472.472 0 00.944 0v-1.363l.427-.413 1.428 2.033a.472.472 0 00.773-.543l-1.514-2.155zm-2.958 1.924h-1.46V9.297a.472.472 0 00-.943 0v4.159c0 .26.21.472.471.472h1.932a.472.472 0 000-.944zm-5.857 0h-1.46V9.297a.472.472 0 00-.943 0v4.159c0 .26.21.472.471.472h1.932a.472.472 0 000-.944zm-2.828-4.157a.472.472 0 00-.472-.472h-1.93a.472.472 0 000 .944h.729v3.715a.472.472 0 00.944 0V9.299h.729a.472.472 0 00.471-.472z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">
                    카카오톡 채널
                  </h3>
                  <a
                    href="https://pf.kakao.com/_권리샵"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-700 hover:underline font-medium"
                  >
                    @권리샵
                  </a>
                  <p className="text-gray-600 text-sm mt-1">
                    실시간 채팅 상담 가능
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ Link */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-700"
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
              <p className="text-gray-700 text-sm mb-3">
                문의 전에 자주 묻는 질문을 확인해보세요
              </p>
              <a
                href="/faq"
                className="inline-block px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 transition-colors"
              >
                FAQ 보러가기
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              문의하기
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
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
                  autoComplete="name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
                  placeholder="홍길동"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
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
                  autoComplete="email"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700 mb-2"
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
                  placeholder="문의 제목을 입력하세요"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-2"
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 resize-none"
                  placeholder="문의 내용을 자세히 작성해주세요"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "제출 중..." : "문의 제출하기"}
              </button>
            </form>

            <p className="text-xs text-gray-500 mt-4 text-center">
              영업일 기준 24시간 내에 답변 드리겠습니다
            </p>
          </div>
        </div>

        {/* Company Info */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            회사 정보
          </h2>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div className="flex">
              <span className="font-semibold text-gray-700 w-32">
                회사명
              </span>
              <span className="text-gray-600">씨이오</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-32">
                대표이사
              </span>
              <span className="text-gray-600">박상만</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-32">
                사업자등록번호
              </span>
              <span className="text-gray-600">408-70-43230</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-32">
                통신판매업
              </span>
              <span className="text-gray-600">
                제2023-서울동작-1252호
              </span>
            </div>
            <div className="flex md:col-span-2">
              <span className="font-semibold text-gray-700 w-32">주소</span>
              <span className="text-gray-600">
                서울특별시 동작구 장승배기로4길 9
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
