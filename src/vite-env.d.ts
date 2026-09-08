/// <reference types="vite/client" />

declare module 'papaparse' {
  const Papa: any;
  export default Papa;
}

declare module 'canvas-confetti' {
  const confetti: any;
  export default confetti;
}

declare module 'jspdf-autotable' {
  const autoTable: any;
  export default autoTable;
}

declare module 'jsbarcode' {
  const JsBarcode: any;
  export default JsBarcode;
}

declare module 'react-dom/client' {
  import * as ReactDOM from 'react-dom';
  export function createRoot(container: Element | DocumentFragment): {
    render(children: React.ReactNode): void;
    unmount(): void;
  };
  export function hydrateRoot(
    container: Element | Document,
    children: React.ReactNode
  ): {
    render(children: React.ReactNode): void;
    unmount(): void;
  };
}
