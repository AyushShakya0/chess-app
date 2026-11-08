import React from "react";

export type PieceColor = "w" | "b";
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

interface PieceProps {
  type: PieceType;
  color: PieceColor;
  className?: string;
  size?: number | string;
}

export const ChessPiece: React.FC<PieceProps> = ({ type, color, className = "", size }) => {
  const isWhite = color === "w";
  const fill = isWhite ? "#ffffff" : "#1a1a1a";
  const stroke = isWhite ? "#1a1a1a" : "#e0e0e0";

  const sizeProps = size ? { width: size, height: size } : {};
  const baseClass = `w-[84%] h-[84%] max-w-full max-h-full select-none pointer-events-none drop-shadow-sm ${className}`;

  switch (type) {
    case "p":
      return (
        <svg viewBox="0 0 45 45" {...sizeProps} className={baseClass}>
          <path
            d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case "r":
      return (
        <svg viewBox="0 0 45 45" {...sizeProps} className={baseClass}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" />
            <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" />
            <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" />
            <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
            <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" />
            <path d="M 11,14 L 34,14" />
            <path d="M 14,29.5 L 12,32 L 33,32 L 31,29.5" />
            <path d="M 14,16.5 L 31,16.5" fill="none" stroke={stroke} strokeLinejoin="miter" />
          </g>
        </svg>
      );

    case "n":
      return (
        <svg viewBox="0 0 45 45" {...sizeProps} className={baseClass}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" />
            <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,7.4 17.07,8.07 18.5,9.5 C 20,7.9 25,6.5 30,9 C 27,13 26,17 22.5,17" />
            <circle cx="15" cy="14.5" r="1.5" fill={stroke} />
            <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" fill={stroke} />
          </g>
        </svg>
      );

    case "b":
      return (
        <svg viewBox="0 0 45 45" {...sizeProps} className={baseClass}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z" />
            <path d="M 12,36 C 11.27,33.5 13,31 15,29 C 17,27 18.21,25.24 18.5,22 C 15.66,19.34 16.5,13.5 19.5,11 C 21.03,9.75 23.97,9.75 25.5,11 C 28.5,13.5 29.34,19.34 26.5,22 C 26.79,25.24 28,27 30,29 C 32,31 33.73,33.5 33,36" />
            <circle cx="22.5" cy="8.5" r="1.5" fill={fill} stroke={stroke} />
            <path d="M 17.5,26 L 27.5,26" fill="none" stroke={stroke} />
            <path d="M 15,30 L 30,30" fill="none" stroke={stroke} />
            <path d="M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" fill="none" stroke={stroke} />
          </g>
        </svg>
      );

    case "q":
      return (
        <svg viewBox="0 0 45 45" {...sizeProps} className={baseClass}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" />
            <path d="M 24 9 A 2 2 0 1 1  20,9 A 2 2 0 1 1  24 9 z" />
            <path d="M 39 13 A 2 2 0 1 1 35,13 A 2 2 0 1 1 39 13 z" />
            <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,14.5 L 31,25 L 22.5,10.5 L 14,25 L 6.5,14.5 Z" />
            <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 L 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 Z" />
            <path d="M 11.5,30 C 15,29 30,29 33.5,30" fill="none" stroke={stroke} />
            <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" fill="none" stroke={stroke} />
          </g>
        </svg>
      );

    case "k":
      return (
        <svg viewBox="0 0 45 45" {...sizeProps} className={baseClass}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22.5,11.5 L 22.5,6 M 20,8 L 25,8" fill="none" stroke={stroke} />
            <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25 Z" />
            <path d="M 12.5,37 C 15,40.5 30,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 Z" />
            <path d="M 12.5,30 C 17,27 28,27 32.5,30" fill="none" stroke={stroke} />
            <path d="M 12.5,33.5 C 17,30.5 28,30.5 32.5,33.5" fill="none" stroke={stroke} />
            <path d="M 12.5,37 C 17,34 28,34 32.5,37" fill="none" stroke={stroke} />
          </g>
        </svg>
      );
  }
};
