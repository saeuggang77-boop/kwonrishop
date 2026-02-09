"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  RIGHTS_CATEGORY_LABELS,
  PROPERTY_TYPE_LABELS,
} from "@/lib/utils/constants";
import { ImageUploader } from "@/components/listings/image-uploader";

interface FormData {
  title: string;
  description: string;
  rightsCategory: string;
  propertyType: string;
  price: string;
  monthlyRent: string;
  maintenanceFee: string;
  address: string;
  addressDetail: string;
  city: string;
  district: string;
  neighborhood: string;
  areaM2: string;
  floor: string;
  totalFloors: string;
  buildYear: string;
  roomCount: string;
  bathroomCount: string;
  registryNumber: string;
  contactPhone: string;
  contactEmail: string;
}

const initialForm: FormData = {
  title: "",
  description: "",
  rightsCategory: "",
  propertyType: "",
  price: "",
  monthlyRent: "",
  maintenanceFee: "",
  address: "",
  addressDetail: "",
  city: "",
  district: "",
  neighborhood: "",
  areaM2: "",
  floor: "",
  totalFloors: "",
  buildYear: "",
  roomCount: "",
  bathroomCount: "",
  registryNumber: "",
  contactPhone: "",
  contactEmail: "",
};

export default function NewListingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [form, setForm] = useState<FormData>(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadedImages, setUploadedImages] = useState<{ key: string; url: string }[]>([]);

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const body: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        rightsCategory: form.rightsCategory,
        propertyType: form.propertyType,
        price: Number(form.price),
        address: form.address,
        city: form.city,
        district: form.district,
      };

      if (form.monthlyRent) body.monthlyRent = Number(form.monthlyRent);
      if (form.maintenanceFee) body.maintenanceFee = Number(form.maintenanceFee);
      if (form.addressDetail) body.addressDetail = form.addressDetail;
      if (form.neighborhood) body.neighborhood = form.neighborhood;
      if (form.areaM2) body.areaM2 = Number(form.areaM2);
      if (form.floor) body.floor = Number(form.floor);
      if (form.totalFloors) body.totalFloors = Number(form.totalFloors);
      if (form.buildYear) body.buildYear = Number(form.buildYear);
      if (form.roomCount) body.roomCount = Number(form.roomCount);
      if (form.bathroomCount) body.bathroomCount = Number(form.bathroomCount);
      if (form.registryNumber) body.registryNumber = form.registryNumber;
      if (form.contactPhone) body.contactPhone = form.contactPhone;
      if (form.contactEmail) body.contactEmail = form.contactEmail;
      if (uploadedImages.length > 0) body.images = uploadedImages;

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error?.message ?? "매물 등록에 실패했습니다.");
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      router.push(`/listings/${data.data.id}`);
    } catch {
      setErrorMsg("서버 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-gray-500">매물 등록은 로그인 후 이용 가능합니다.</p>
        <Link href="/login" className="mt-4 inline-block rounded-lg bg-mint px-6 py-3 text-sm font-medium text-white hover:bg-mint-dark">
          로그인하기
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-navy">매물 등록</h1>
      <p className="mt-1 text-sm text-gray-500">부동산 권리 매물 정보를 입력해주세요.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {errorMsg && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMsg}
          </div>
        )}

        {/* Basic Info */}
        <Section title="기본 정보">
          <Field label="제목" required>
            <input
              required
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="예: 강남역 전세권 아파트 2억"
              className="input-field"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="권리유형" required>
              <select
                required
                value={form.rightsCategory}
                onChange={(e) => update("rightsCategory", e.target.value)}
                className="input-field"
              >
                <option value="">선택</option>
                {Object.entries(RIGHTS_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="매물유형" required>
              <select
                required
                value={form.propertyType}
                onChange={(e) => update("propertyType", e.target.value)}
                className="input-field"
              >
                <option value="">선택</option>
                {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="상세 설명" required>
            <textarea
              required
              rows={5}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="매물에 대한 상세 설명을 입력해주세요. (10자 이상)"
              className="input-field resize-y"
            />
          </Field>
        </Section>

        {/* Price */}
        <Section title="가격 정보">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="가격 (원)" required>
              <input
                type="number"
                required
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                placeholder="200000000"
                className="input-field"
              />
            </Field>
            <Field label="월세 (원)">
              <input
                type="number"
                value={form.monthlyRent}
                onChange={(e) => update("monthlyRent", e.target.value)}
                placeholder="0"
                className="input-field"
              />
            </Field>
            <Field label="관리비 (원)">
              <input
                type="number"
                value={form.maintenanceFee}
                onChange={(e) => update("maintenanceFee", e.target.value)}
                placeholder="0"
                className="input-field"
              />
            </Field>
          </div>
        </Section>

        {/* Location */}
        <Section title="위치 정보">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="시/도" required>
              <input
                required
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                placeholder="서울특별시"
                className="input-field"
              />
            </Field>
            <Field label="구/군" required>
              <input
                required
                value={form.district}
                onChange={(e) => update("district", e.target.value)}
                placeholder="강남구"
                className="input-field"
              />
            </Field>
            <Field label="동/읍/면">
              <input
                value={form.neighborhood}
                onChange={(e) => update("neighborhood", e.target.value)}
                placeholder="역삼동"
                className="input-field"
              />
            </Field>
          </div>
          <Field label="주소" required>
            <input
              required
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="서울특별시 강남구 역삼동 123-45"
              className="input-field"
            />
          </Field>
          <Field label="상세주소">
            <input
              value={form.addressDetail}
              onChange={(e) => update("addressDetail", e.target.value)}
              placeholder="101동 1202호"
              className="input-field"
            />
          </Field>
        </Section>

        {/* Property Details */}
        <Section title="매물 상세">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="면적 (m²)">
              <input type="number" step="0.01" value={form.areaM2} onChange={(e) => update("areaM2", e.target.value)} placeholder="84.5" className="input-field" />
            </Field>
            <Field label="층">
              <input type="number" value={form.floor} onChange={(e) => update("floor", e.target.value)} placeholder="12" className="input-field" />
            </Field>
            <Field label="총 층수">
              <input type="number" value={form.totalFloors} onChange={(e) => update("totalFloors", e.target.value)} placeholder="25" className="input-field" />
            </Field>
            <Field label="건축년도">
              <input type="number" value={form.buildYear} onChange={(e) => update("buildYear", e.target.value)} placeholder="2020" className="input-field" />
            </Field>
            <Field label="방 수">
              <input type="number" value={form.roomCount} onChange={(e) => update("roomCount", e.target.value)} placeholder="3" className="input-field" />
            </Field>
            <Field label="화장실 수">
              <input type="number" value={form.bathroomCount} onChange={(e) => update("bathroomCount", e.target.value)} placeholder="2" className="input-field" />
            </Field>
          </div>
          <Field label="등기번호">
            <input value={form.registryNumber} onChange={(e) => update("registryNumber", e.target.value)} placeholder="등기번호 입력" className="input-field" />
          </Field>
        </Section>

        {/* Images */}
        <Section title="매물 사진">
          <ImageUploader
            listingId="new"
            onImagesChange={setUploadedImages}
          />
        </Section>

        {/* Contact */}
        <Section title="연락처">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="전화번호">
              <input type="tel" value={form.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} placeholder="010-1234-5678" className="input-field" />
            </Field>
            <Field label="이메일">
              <input type="email" value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} placeholder="seller@example.com" className="input-field" />
            </Field>
          </div>
        </Section>

        {/* Submit */}
        <div className="flex gap-3 border-t border-gray-200 pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-mint px-8 py-3 text-sm font-medium text-white hover:bg-mint-dark disabled:opacity-50"
          >
            {isLoading ? "등록 중..." : "매물 등록"}
          </button>
          <Link
            href="/listings"
            className="rounded-lg border border-gray-300 px-8 py-3 text-sm text-gray-600 hover:bg-gray-50"
          >
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-bold text-navy">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
