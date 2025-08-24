import { brandColors } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface CurvedArrowProps {
  className?: string;
  mirrored?: boolean;
  size?: number;
}

export function CurvedArrow({
  className = "",
  mirrored = false,
  size = 0.2,
}: CurvedArrowProps) {
  const svgWidth = size * 193.82;
  const svgHeight = size * 597.157;
  const color = brandColors.dark.primary;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={svgWidth}
      height={svgHeight}
      viewBox="0 0 64.607 199.052"
      className={cn(className, mirrored ? "scale-x-[-1]" : "")}
    >
      <g strokeLinecap="round">
        <path
          fill="none"
          stroke={color}
          strokeDasharray="8 12"
          strokeWidth="4.5"
          d="M10.002 10c7.44 8.55 40.24 32.7 44.18 53.47 3.93 20.76-20.49 50.2-20.57 71.13s16.74 45.52 20.09 54.45"
        ></path>
        <path
          fill={color}
          fillRule="evenodd"
          d="m54.392 188.68-10.85-7.93 7.92-7.58.87 15.97"
        ></path>
        <path
          fill="none"
          stroke={color}
          strokeWidth="4.5"
          d="M53.702 189.05c-3.85-2.95-4.4-4.45-11.72-9.35m0 0c2.64-1.65 4.31-1.17 11.35-5.64m0 0c-.43 4.17-.57 7.51.37 14.99m0 0q0 0 0 0"
        ></path>
      </g>
    </svg>
  );
}
