import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "dark:bg-accent bg-primary/40 animate-pulse rounded-lg",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
