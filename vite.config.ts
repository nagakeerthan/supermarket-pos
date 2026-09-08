import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('kalaaSagarItems.json')) return 'catalog-data';
          if (id.includes('node_modules/recharts')) return 'vendor-charts';
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) return 'vendor-pdf';
          if (id.includes('node_modules/lucide-react')) return 'vendor-icons';
          if (id.includes('node_modules/framer-motion')) return 'vendor-animation';
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) return 'vendor-react';
        },
      },
    },
  },
});

