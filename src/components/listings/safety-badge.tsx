import { CheckCircle, FileText, Shield } from "lucide-react";

interface SafetyBadgeProps {
  grade: string;
  size?: "sm" | "md";
}

export function SafetyBadge({ grade, size = "sm" }: SafetyBadgeProps) {
  // C grade = no badge shown
  if (grade === "C") return null;

  const config = grade === "A"
    ? { bg: "bg-green-100", color: "text-green-700", border: "border-green-300", label: "매출 인증", Icon: CheckCircle }
    : { bg: "bg-amber-100", color: "text-amber-700", border: "border-amber-300", label: "매출 증빙", Icon: FileText };

  const sizeClasses = size === "sm"
    ? "px-2 py-0.5 text-[11px] gap-1"
    : "px-3 py-1 text-xs gap-1.5";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <span className={`inline-flex items-center rounded-full border font-bold ${sizeClasses} ${config.bg} ${config.color} ${config.border}`}>
      <config.Icon className={iconSize} />
      {config.label}
    </span>
  );
}

export function DiagnosisBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  const sizeClasses = size === "sm"
    ? "px-2 py-0.5 text-[11px] gap-1"
    : "px-3 py-1 text-xs gap-1.5";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${sizeClasses} bg-purple-100 text-purple-700 border-purple-300`}>
      <Shield className={iconSize} />
      권리진단 완료
    </span>
  );
}
