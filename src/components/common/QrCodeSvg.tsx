import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
  bgColor?: string;
  fgColor?: string;
  includeMargin?: boolean;
}

export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  value,
  size = 120,
  className = '',
  bgColor = '#ffffff',
  fgColor = '#000000',
  includeMargin = false,
}) => {
  if (!value) return null;

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <QRCodeSVG
        value={value}
        size={size}
        bgColor={bgColor}
        fgColor={fgColor}
        level="M"
        includeMargin={includeMargin}
      />
    </div>
  );
};
