import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "py-8",
  md: "py-12",
  lg: "py-16",
  xl: "py-24",
};

export function Section({ children, className, size = "lg" }: SectionProps) {
  return (
    <section className={cn("section", sizeClasses[size], className)}>
      {children}
    </section>
  );
}