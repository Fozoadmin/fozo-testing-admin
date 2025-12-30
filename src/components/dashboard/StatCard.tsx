import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  icon: LucideIcon;
  title: string;
  value: React.ReactNode;
  suffix?: string;
  delta?: number;
  className?: string;
  onClick?: () => void;
};

export function StatCard({ icon: Icon, title, value, suffix = "", delta, className = "", onClick }: StatCardProps) {
  return (
    <Card
      className={cn(
        "rounded-2xl shadow-sm",
        onClick && "cursor-pointer transition-colors hover:bg-muted/60",
        className,
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm text-muted-foreground font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-semibold flex items-baseline gap-1">
          <span>{value}</span>
          {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        </div>
        {typeof delta !== "undefined" && (
          <div className={`mt-1 text-xs ${delta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {delta >= 0 ? "+" : ""}
            {delta}% vs last week
          </div>
        )}
      </CardContent>
    </Card>
  );
}

