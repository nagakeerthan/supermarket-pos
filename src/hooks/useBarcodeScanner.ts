import { useEffect, useRef } from 'react';

interface BarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minChars?: number;
  maxIntervalMs?: number;
  enabled?: boolean;
}

/**
 * Hook to capture hardware barcode scanner inputs (acting as USB HID keyboard wedge).
 * Hardware scanners type characters very quickly (< 30ms apart) and conclude with Enter key.
 */
export function useBarcodeScanner({
  onScan,
  minChars = 4,
  maxIntervalMs = 45,
  enabled = true,
}: BarcodeScannerOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is actively typing inside an input or textarea that is not marked as POS scanner target
      const target = event.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      const isPosBarcodeFocused = target?.getAttribute('data-barcode-input') === 'true';

      // If user is typing in regular text fields (like a search input), let the input handle it,
      // unless it's the barcode fast-wedge or Enter key
      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (event.key === 'Enter') {
        if (bufferRef.current.length >= minChars) {
          const barcode = bufferRef.current.trim();
          bufferRef.current = '';
          event.preventDefault();
          onScan(barcode);
          return;
        }
        bufferRef.current = '';
        return;
      }

      // Scanner chars arrive with very short intervals (<45ms)
      if (timeDiff > maxIntervalMs && bufferRef.current.length > 0) {
        // Reset buffer if delay too long (manual slow typing)
        bufferRef.current = '';
      }

      // Printable single chars
      if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
        if (!isInput || isPosBarcodeFocused) {
          bufferRef.current += event.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan, minChars, maxIntervalMs, enabled]);
}
