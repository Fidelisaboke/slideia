import React from "react";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export default function Logo({ className, ...props }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      {...props}
    >
      <defs>
        <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="4"
            stdDeviation="6"
            flood-color="#0d0b14"
            flood-opacity="0.25"
          />
        </filter>

        <linearGradient
          id="logoBackSlideGrad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stop-color="#7c5cca" stop-opacity="0.2" />
          <stop offset="100%" stop-color="#c084fc" stop-opacity="0.05" />
        </linearGradient>

        <linearGradient
          id="logoMidSlideGrad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stop-color="#7c5cca" stop-opacity="0.5" />
          <stop offset="100%" stop-color="#a78bfa" stop-opacity="0.15" />
        </linearGradient>

        <linearGradient
          id="logoFrontSlideGrad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stop-color="#a78bfa" />
          <stop offset="100%" stop-color="#5eead4" />
        </linearGradient>
      </defs>

      <ellipse cx="42" cy="84" rx="28" ry="5" fill="#0d0b14" opacity="0.4" />

      <g transform="translate(8, 38) rotate(-15) skewX(14)">
        <rect
          width="52"
          height="34"
          rx="6"
          fill="url(#logoBackSlideGrad)"
          stroke="#7c5cca"
          stroke-width="1"
          stroke-opacity="0.3"
        />
      </g>

      <g transform="translate(20, 26) rotate(-15) skewX(14)">
        <rect
          width="52"
          height="34"
          rx="6"
          fill="url(#logoMidSlideGrad)"
          stroke="#a78bfa"
          stroke-width="1.2"
          stroke-opacity="0.4"
        />
      </g>

      <g
        transform="translate(32, 14) rotate(-15) skewX(14)"
        filter="url(#logoShadow)"
      >
        <rect
          width="52"
          height="34"
          rx="6"
          fill="url(#logoFrontSlideGrad)"
          stroke="white"
          stroke-width="1"
          stroke-opacity="0.25"
        />

        <rect
          x="6"
          y="6"
          width="16"
          height="3.5"
          rx="1.75"
          fill="white"
          fill-opacity="0.85"
        />

        <rect
          x="6"
          y="13.5"
          width="18"
          height="14"
          rx="2.5"
          fill="white"
          fill-opacity="0.3"
        />
        <circle cx="15" cy="20.5" r="3.5" fill="white" fill-opacity="0.2" />

        <rect
          x="28"
          y="13.5"
          width="18"
          height="2"
          rx="1"
          fill="white"
          fill-opacity="0.7"
        />
        <rect
          x="28"
          y="18"
          width="14"
          height="2"
          rx="1"
          fill="white"
          fill-opacity="0.7"
        />
        <rect
          x="28"
          y="22.5"
          width="16"
          height="2"
          rx="1"
          fill="white"
          fill-opacity="0.7"
        />
      </g>
    </svg>
  );
}
