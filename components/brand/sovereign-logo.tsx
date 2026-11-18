"use client";

import React from "react";
import Link from "next/link";

interface SovereignKnightIconProps {
  className?: string;
  size?: number | string;
  glow?: boolean;
}

export const SovereignKnightIcon: React.FC<SovereignKnightIconProps> = ({
  className = "w-8 h-8",
  size,
  glow = false,
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${glow ? "drop-shadow-[0_0_12px_rgba(212,163,89,0.5)]" : ""}`}
      style={style}
    >
      <defs>
        {/* Signature Sovereign Gold Metallic Gradient */}
        <linearGradient id="sovereignGold" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#FFF1CC" />
          <stop offset="25%" stopColor="#E5BE6E" />
          <stop offset="65%" stopColor="#C99341" />
          <stop offset="100%" stopColor="#8C5E1B" />
        </linearGradient>

        {/* Secondary Shading Facet Gradient */}
        <linearGradient id="sovereignShade" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F9DF98" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#D4A359" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#6E4410" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Main Knight Bust Silhouette facing right */}
      <path
        d="M26 88C26 88 28 80 32 72C36 64 42 58 45 52C48 46 48 38 45 32C43 28 39 24 37 18C36 15 37 12 40 10C43 8 47 11 49 14C51 17 52 20 55 22C58 24 64 24 70 27C76 30 81 35 83 41C85 47 83 52 78 55C73 58 64 58 57 56C53 55 49 56 46 59C42 63 38 72 38 88H26Z"
        fill="url(#sovereignGold)"
      />

      {/* Noble Mane Arch & Crown Crest */}
      <path
        d="M37 18C39 24 43 28 45 32C48 38 48 46 45 52C42 58 36 64 32 72C28 80 26 88 26 88C23 88 20 84 21 78C22 70 25 61 28 53C31 44 33 36 33 28C33 22 31 17 33 13C34 11 36 10 38 11C36 13 36 16 37 18Z"
        fill="url(#sovereignShade)"
      />

      {/* Sleek Facet Highlight on Muzzle/Cheek */}
      <path
        d="M55 26C60 28 66 29 71 32C76 35 79 39 80 44C78 43 74 41 70 41C64 41 59 43 54 42C51 41 49 39 49 36C50 32 52 29 55 26Z"
        fill="#FFE6A8"
        fillOpacity="0.45"
      />

      {/* Knight Eye Slit */}
      <circle cx="64" cy="36" r="2.5" fill="#14171F" />
      <circle cx="64.5" cy="35.5" r="1" fill="#FFF6DC" />
    </svg>
  );
};

interface SovereignLogoProps {
  href?: string;
  tagline?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
}

export const SovereignLogo: React.FC<SovereignLogoProps> = ({
  href = "/bots",
  tagline = "Grandmaster Suite",
  size = "md",
  className = "",
  showText = true,
}) => {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12",
  };

  const titleSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  };

  const content = (
    <div className={`flex items-center gap-3 cursor-pointer select-none group ${className}`}>
      <div className="relative flex items-center justify-center p-1 rounded-xl bg-gradient-to-br from-[#1c212c] to-[#0d0f14] border border-[#2c3240] group-hover:border-[#d4a359]/60 shadow-lg transition-all duration-300">
        <SovereignKnightIcon className={`${iconSizes[size]} transition-transform duration-300 group-hover:scale-105`} glow />
      </div>
      {showText && (
        <div>
          <div className={`font-black font-display tracking-tight text-white flex items-center gap-1.5 ${titleSizes[size]}`}>
            <span>SOVEREIGN</span>
            <span className="gold-gradient-text">CHESS</span>
          </div>
          {tagline && (
            <span className="text-[10px] text-[#d4a359]/80 font-mono tracking-widest uppercase block -mt-1 font-bold">
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
};
