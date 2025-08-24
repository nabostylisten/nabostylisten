import { brandColors } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface WindingArrowProps {
  className?: string;
  mirrored?: boolean;
  size?: number;
}

export function WindingArrow({
  className = "",
  mirrored = false,
  size = 0.2,
}: WindingArrowProps) {
  const svgWidth = size * 277.578;
  const svgHeight = size * 602.456;
  const color = brandColors.dark.primary;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={svgWidth}
      height={svgHeight}
      viewBox="0 0 92.526 200.819"
      className={cn(className, mirrored ? "scale-x-[-1]" : "")}
    >
      <g strokeLinecap="round">
        <path
          fill="none"
          stroke={color}
          strokeDasharray="8 12"
          strokeWidth="4.5"
          d="M63.113 10.004c0 6.88-.05 29.66-1.06 41.77s-2.34 20.32-5 30.88c-2.67 10.56-6.37 25.15-10.98 32.48-4.6 7.33-11.03 11.67-16.64 11.51-5.61-.17-14.03-7.07-17.04-12.5-3-5.43-3-15.5-1-20.08s5.59-6.82 13-7.39c7.41-.56 22.6-.08 31.45 4.01s17.36 10.17 21.64 20.53c4.29 10.36 6.42 28.39 4.08 41.65-2.35 13.27-15.29 31.43-18.14 37.96"
        />
        <path
          fill={color}
          fillRule="evenodd"
          d="m63.873 189.044-1.4-13.27 12.56 7.17-12.18 7.8"
        />
        <path
          fill="none"
          stroke={color}
          strokeWidth="4.5"
          d="M63.423 190.824c.27-4.12 1.62-10.78 1.02-14.97m0 0c4.9 3.38 8.68 4.46 11.1 6.13m0 0c-3.13 3.75-6.69 3.24-12.12 8.84m0 0q0 0 0 0"
        />
      </g>
    </svg>
  );
}
