import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

const filled = { fill: "currentColor", stroke: "none" } as const;

export const PlayIcon = (p: IconProps) => <Svg {...filled} {...p}><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></Svg>;
export const PauseIcon = (p: IconProps) => <Svg {...filled} {...p}><rect x="6" y="5" width="4" height="14" rx="1.2" /><rect x="14" y="5" width="4" height="14" rx="1.2" /></Svg>;
export const PrevIcon = (p: IconProps) => <Svg {...filled} {...p}><rect x="5" y="5" width="2.5" height="14" rx="1" /><path d="M19 6.2v11.6a.8.8 0 0 1-1.25.66L9.4 12.66a.8.8 0 0 1 0-1.32l8.35-5.8A.8.8 0 0 1 19 6.2Z" /></Svg>;
export const NextIcon = (p: IconProps) => <Svg {...filled} {...p}><rect x="16.5" y="5" width="2.5" height="14" rx="1" /><path d="M5 6.2v11.6a.8.8 0 0 0 1.25.66l8.35-5.8a.8.8 0 0 0 0-1.32l-8.35-5.8A.8.8 0 0 0 5 6.2Z" /></Svg>;
export const StarIcon = ({ active, ...p }: IconProps & { active?: boolean }) => (
  <Svg {...p} {...(active ? { fill: "currentColor" } : {})}>
    <path d="m12 3.5 2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.65l5.9-.85L12 3.5Z" />
  </Svg>
);
export const VolumeIcon = (p: IconProps) => <Svg {...p}><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" /></Svg>;
export const MuteIcon = (p: IconProps) => <Svg {...p}><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" /><path d="m16 9.5 5 5m0-5-5 5" /></Svg>;
export const RepeatIcon = (p: IconProps) => <Svg {...p}><path d="M17 3l3 3-3 3" /><path d="M4 11V9.5A3.5 3.5 0 0 1 7.5 6H20" /><path d="M7 21l-3-3 3-3" /><path d="M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H4" /></Svg>;
export const MoreIcon = (p: IconProps) => <Svg {...filled} {...p}><circle cx="5.5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="18.5" cy="12" r="1.8" /></Svg>;
