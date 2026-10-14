import React from 'react';
import { BackdropTheme } from '../types';

interface Props {
  theme: BackdropTheme;
  dimLevel: number; // 0 to 100
}

export const AtmosphereBackground: React.FC<Props> = ({ theme, dimLevel }) => {
  const getThemeImage = () => {
    switch (theme) {
      case 'nordic':
        return '/src/assets/images/ambient_nordic_mist_1791966642186.jpg';
      case 'zen':
        return '/src/assets/images/ambient_japanese_zen_1791966643687.jpg';
      case 'observatory':
        return '/src/assets/images/ambient_midnight_observatory_1791966643681.jpg';
      default:
        return null;
    }
  };

  const imageSrc = getThemeImage();

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-neutral-950">
      {imageSrc && (
        <img
          src={imageSrc}
          alt="Atmospheric environment"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center filter blur-[1px] transition-opacity duration-1000 scale-105"
          style={{ opacity: 0.35 }}
        />
      )}

      {/* Dim overlay for contrast discipline */}
      <div
        className="absolute inset-0 bg-neutral-950 transition-opacity duration-500"
        style={{
          opacity: imageSrc ? (dimLevel / 100) * 0.85 + 0.15 : 0.95,
        }}
      />

      {/* Subtle organic radial vignette */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-neutral-950/60 to-neutral-950 pointer-events-none" />
    </div>
  );
};
