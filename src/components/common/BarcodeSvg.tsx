import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeSvgProps {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'UPC' | 'EAN8';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
}

export const BarcodeSvg: React.FC<BarcodeSvgProps> = ({
  value,
  format = 'CODE128',
  width = 1.5,
  height = 40,
  displayValue = true,
  fontSize = 12,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format,
          width,
          height,
          displayValue,
          fontSize,
          margin: 0,
          background: 'transparent',
          lineColor: '#000000',
        });
      } catch {
        // If EAN13 check digits fail, fallback smoothly to CODE128
        try {
          JsBarcode(svgRef.current, value, {
            format: 'CODE128',
            width,
            height,
            displayValue,
            fontSize,
            margin: 0,
            background: 'transparent',
            lineColor: '#000000',
          });
        } catch {
          // Silent fallback
        }
      }
    }
  }, [value, format, width, height, displayValue, fontSize]);

  return <svg ref={svgRef} className={className} />;
};
