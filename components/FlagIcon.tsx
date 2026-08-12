"use client";

import { useId } from "react";

export type FlagCountry = "fr" | "gb";

export default function FlagIcon({
  country,
  className = "",
}: {
  country: FlagCountry;
  className?: string;
}) {
  const id = useId();

  if (country === "fr") {
    return (
      <svg viewBox="0 0 3 2" className={className} aria-hidden="true">
        <rect width="3" height="2" fill="#fff" />
        <rect width="1" height="2" fill="#002654" />
        <rect x="2" width="1" height="2" fill="#CE1126" />
      </svg>
    );
  }

  const clipS = `${id}-s`;
  const clipT = `${id}-t`;

  return (
    <svg viewBox="0 0 60 30" className={className} aria-hidden="true">
      <clipPath id={clipS}>
        <path d="M0,0v30h60V0z" />
      </clipPath>
      <clipPath id={clipT}>
        <path d="M30,15h30v15zM30,15v15h-30zM30,0h30v15zM30,0v15h-30z" />
      </clipPath>
      <g clipPath={`url(#${clipS})`}>
        <path d="M0,0v30h60V0z" fill="#012169" />
        <path
          d="M0,0l60,30M60,0L0,30"
          stroke="#fff"
          strokeWidth="6"
          fill="none"
        />
        <path
          d="M0,0l60,30M60,0L0,30"
          clipPath={`url(#${clipT})`}
          stroke="#C8102E"
          strokeWidth="4"
          fill="none"
        />
        <path
          d="M30,0v30M0,15h60"
          stroke="#fff"
          strokeWidth="10"
          fill="none"
        />
        <path
          d="M30,0v30M0,15h60"
          stroke="#C8102E"
          strokeWidth="6"
          fill="none"
        />
      </g>
    </svg>
  );
}
