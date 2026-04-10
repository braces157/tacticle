import type { ReactNode } from "react";

type IconName =
  | "arrow-right"
  | "cart"
  | "search"
  | "user"
  | "chevron-right"
  | "minus"
  | "plus"
  | "close"
  | "dashboard"
  | "inventory"
  | "bell"
  | "settings"
  | "edit"
  | "trash"
  | "chart"
  | "users"
  | "reviews"
  | "ticket";

const paths: Record<IconName, ReactNode> = {
  "arrow-right": (
    <path
      d="M5 12h14m-5-5 5 5-5 5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  ),
  cart: (
    <>
      <path
        d="M3 4h2l2.2 9.5a1 1 0 0 0 1 .8H17a1 1 0 0 0 1-.8L20 7H7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <circle cx="9.5" cy="19" r="1" fill="currentColor" />
      <circle cx="17.5" cy="19" r="1" fill="currentColor" />
    </>
  ),
  search: (
    <>
      <circle
        cx="11"
        cy="11"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M20 20l-4.2-4.2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </>
  ),
  user: (
    <>
      <circle
        cx="12"
        cy="8"
        r="3.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5.5 19c1.4-3.1 3.7-4.6 6.5-4.6S17.1 15.9 18.5 19"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </>
  ),
  "chevron-right": (
    <path
      d="M9 6l6 6-6 6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  ),
  minus: (
    <path
      d="M5 12h14"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.5"
    />
  ),
  plus: (
    <path
      d="M12 5v14M5 12h14"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.5"
    />
  ),
  close: (
    <path
      d="M6 6l12 12M18 6 6 18"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.5"
    />
  ),
  dashboard: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="4" width="7" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="10" width="7" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </>
  ),
  inventory: (
    <>
      <path d="M4 7.5 12 4l8 3.5-8 3.5L4 7.5Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <path d="M4 12l8 3.5 8-3.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <path d="M4 16.5 12 20l8-3.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
    </>
  ),
  bell: (
    <>
      <path d="M8 17h8l-1-2v-4a3 3 0 1 0-6 0v4l-1 2Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.7 6.3l-1.6 1.6M7.9 16.1l-1.6 1.6M17.7 17.7l-1.6-1.6M7.9 7.9 6.3 6.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4l9.5-9.5a1.8 1.8 0 0 0 0-2.5l-1.5-1.5a1.8 1.8 0 0 0-2.5 0L4 16v4Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <path d="m12.5 7.5 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  trash: (
    <>
      <path d="M5 7h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 7l1 12h8l1-12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <path d="M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  chart: (
    <>
      <path d="M5 19V9M12 19V5M19 19v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 19h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16.5" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 18c.8-2.5 2.5-3.8 4.5-3.8s3.7 1.3 4.5 3.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 17c.4-1.6 1.5-2.5 3-2.5 1.3 0 2.3.7 2.9 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  reviews: (
    <>
      <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H10l-4 4v-4H7.5A2.5 2.5 0 0 1 5 12.5v-6Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <path d="M9 8.5h6M9 11.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  ticket: (
    <>
      <path
        d="M5 7.5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2a1.5 1.5 0 0 0 0 3v2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-2a1.5 1.5 0 0 0 0-3v-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
      />
      <path d="M12 7.5v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
};

export function Icon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
    >
      {paths[name]}
    </svg>
  );
}
