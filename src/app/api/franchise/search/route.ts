import { NextResponse } from "next/server";
import { searchFranchiseBrands } from "@/lib/api/ftc";

/**
 * 공정위 API로 프랜차이즈 브랜드 검색 (라이브 검색)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");

    if (!query) {
      return NextResponse.json(
        { error: "검색어가 필요합니다" },
        { status: 400 }
      );
    }

    const result = await searchFranchiseBrands(query, page);

    return NextResponse.json({
      brands: result.brands,
      total: result.total,
      query,
      page,
    });
  } catch (error) {
    console.error("Error searching FTC brands:", error);
    return NextResponse.json(
      { error: "Failed to search franchise brands" },
      { status: 500 }
    );
  }
}
