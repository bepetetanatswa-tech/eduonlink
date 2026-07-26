interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  xmlns: "http://www.w3.org/2000/svg",
});

export function IconGraduate({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 9l10-5 10 5-10 5-10-5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 11.5V17c0 1.1 2.7 3 6 3s6-1.9 6-3v-5.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 9v6" />
    </svg>
  );
}

export function IconChalkboard({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <rect x="3" y="4" width="18" height="12" rx="1" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 9h6M7 12h4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l3-4 3 4" />
    </svg>
  );
}

export function IconFamily({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <circle cx="8" cy="8" r="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="17" cy="9" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 20c0-2.2-.8-4.2-2.2-5.6a5.5 5.5 0 016.7 1.1c.9 1.2 1.5 2.8 1.5 4.5" />
    </svg>
  );
}

export function IconSchool({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 21V10l8-5 8 5v11" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21v-6h6v6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 21h16" />
    </svg>
  );
}

export function IconMail({ size = 16, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

export function IconLock({ size = 16, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

export function IconChevronRight({ size = 16, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function IconChevronDown({ size = 16, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function IconCheck({ size = 14, className, strokeWidth = 2.4 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function IconBook({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 014 18.5v-13z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 001.5-1.5v-13z" />
    </svg>
  );
}

export function IconFlask({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6M10 3v6l-5.5 9.5A1.8 1.8 0 006.1 21h11.8a1.8 1.8 0 001.6-2.6L14 9V3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16h8" />
    </svg>
  );
}

export function IconRadio({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 8.5a5 5 0 000 7M15.5 8.5a5 5 0 010 7M5.5 5.5a9 9 0 000 13M18.5 5.5a9 9 0 010 13" />
    </svg>
  );
}

export function IconFileText({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  );
}

export function IconMessage({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a8 8 0 01-11.5 7.2L4 20l1.1-4.2A8 8 0 1121 12z" />
    </svg>
  );
}

export function IconPencilCheck({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 15.5V20h4.5L20 8.5l-4.5-4.5L4 15.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 5.5L18.5 11" />
    </svg>
  );
}

export function IconBell({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 8a6 6 0 10-12 0c0 5.5-2 7-2 7h16s-2-1.5-2-7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 20a1.8 1.8 0 003 0" />
    </svg>
  );
}

export function IconSettings({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09A1.65 1.65 0 0015 4.6a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

export function IconLogOut({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

export function IconSearch({ size = 18, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <circle cx="11" cy="11" r="7" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
    </svg>
  );
}

export function IconMenu({ size = 20, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function IconWrench({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 005.4-5.4l-2.7 2.7-2.7-.6-.6-2.7 2.7-2.7z" />
    </svg>
  );
}

export function IconChip({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <rect x="7" y="7" width="10" height="10" rx="1" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2" />
    </svg>
  );
}

export function IconChartBar({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  );
}

export function IconPhone({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <rect x="7" y="2" width="10" height="20" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 18h2" />
    </svg>
  );
}

export function IconTag({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.5 3H5a2 2 0 00-2 2v6.5a2 2 0 00.6 1.4l8.5 8.5a2 2 0 002.8 0l6.6-6.6a2 2 0 000-2.8l-8.5-8.5a2 2 0 00-1.5-.5z" />
      <circle cx="8" cy="8" r="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCoins({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <ellipse cx="9" cy="7" rx="6" ry="3" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v4c0 1.7 2.7 3 6 3s6-1.3 6-3V7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11v4c0 1.7 2.7 3 6 3 .7 0 1.4-.07 2-.2M15 10.5c2.9.3 6 1.5 6 3.2v4c0 1.7-3.1 3-6 3-2.5 0-4.7-.9-5.5-2.2" />
    </svg>
  );
}

export function IconAlertTriangle({ size = 20, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9L2.5 18a1.8 1.8 0 001.6 2.7h15.8a1.8 1.8 0 001.6-2.7L13.7 3.9a1.8 1.8 0 00-3.4 0z" />
    </svg>
  );
}
