import { getSDG } from "@/lib/sdgs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function SDGBadge({ id, showLabel = false, className = "" }: { id: number, showLabel?: boolean, className?: string }) {
  const sdg = getSDG(id);
  const Icon = sdg.icon;

  const content = (
    <div 
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm no-default-active-elevate ${className}`}
      style={{ backgroundColor: sdg.color }}
    >
      <Icon className="w-3.5 h-3.5" />
      {showLabel ? sdg.name : `SDG ${id}`}
    </div>
  );

  if (showLabel) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {content}
      </TooltipTrigger>
      <TooltipContent className="font-medium">
        {sdg.name}
      </TooltipContent>
    </Tooltip>
  );
}
