import { ReactNode } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  comparison?: string;
  comparisonType?: "positive" | "negative" | "neutral";
  icon?: ReactNode;
}

export function KPICard({ title, value, comparison, comparisonType = "positive", icon }: KPICardProps) {
  return (
    <div className="bg-surface-0 border border-border-200 rounded-[20px] p-6 shadow-[0_4px_16px_rgba(24,31,22,0.02)] flex flex-col justify-between">
      <div className="flex items-center gap-3 mb-4">
        {icon && (
          <div className="w-10 h-10 rounded-full bg-surface-100 border border-border-200/50 flex items-center justify-center text-ink-600">
            {icon}
          </div>
        )}
        <h3 className="text-[15px] font-medium text-ink-600">{title}</h3>
      </div>
      
      <div>
        <div className="text-[32px] font-medium text-ink-950 mb-2 tracking-tight">
          {value}
        </div>
        
        {comparison && (
          <div className={`flex items-center gap-1.5 text-[13px] font-medium ${
            comparisonType === "positive" ? "text-olive-700" : 
            comparisonType === "negative" ? "text-terracotta-600" : 
            "text-ink-600"
          }`}>
            {comparisonType === "positive" && <ArrowUp size={14} strokeWidth={2.5} />}
            {comparisonType === "negative" && <ArrowDown size={14} strokeWidth={2.5} />}
            {comparison}
          </div>
        )}
      </div>
    </div>
  );
}
