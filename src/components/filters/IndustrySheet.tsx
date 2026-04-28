"use client";

import { RefObject, useEffect, useState } from "react";
import BottomSheet from "./BottomSheet";
import Select from "./Select";

interface CategoryItem {
  id: string;
  name: string;
  subCategories: { id: string; name: string }[];
}

interface IndustrySheetProps {
  open: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  initialCategoryId: string;
  initialSubCategoryId: string;
  onApply: (next: { categoryId: string; subCategoryId: string }) => void;
  anchorRef?: RefObject<HTMLElement | null>;
  popoverWidth?: number;
}

export default function IndustrySheet({
  open,
  onClose,
  categories,
  initialCategoryId,
  initialSubCategoryId,
  onApply,
  anchorRef,
  popoverWidth = 720,
}: IndustrySheetProps) {
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [subCategoryId, setSubCategoryId] = useState(initialSubCategoryId);

  useEffect(() => {
    if (open) {
      setCategoryId(initialCategoryId);
      setSubCategoryId(initialSubCategoryId);
    }
  }, [open, initialCategoryId, initialSubCategoryId]);

  const categoryOptions = [
    { value: "", label: "전체 업종" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const subOptions = [
    {
      value: "",
      label: selectedCategory ? "전체 상세업종" : "업종을 먼저 선택하세요",
    },
    ...(selectedCategory?.subCategories.map((s) => ({
      value: s.id,
      label: s.name,
    })) || []),
  ];

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="업종"
      onSubmit={() => onApply({ categoryId, subCategoryId })}
      anchorRef={anchorRef}
      popoverWidth={popoverWidth}
      hideSubmit
    >
      <div className="space-y-4">
        <Select
          label="업종 대분류"
          value={categoryId}
          onChange={(v) => {
            setCategoryId(v);
            setSubCategoryId("");
            onApply({ categoryId: v, subCategoryId: "" });
          }}
          options={categoryOptions}
          placeholder="업종 선택"
        />
        <Select
          label="상세업종"
          value={subCategoryId}
          onChange={(v) => {
            setSubCategoryId(v);
            onApply({ categoryId, subCategoryId: v });
            onClose();
          }}
          options={subOptions}
          placeholder="상세업종 선택"
          disabled={!categoryId}
        />
      </div>
    </BottomSheet>
  );
}
