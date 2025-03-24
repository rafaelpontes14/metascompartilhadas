import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Validação das variáveis de ambiente
  if (!env.VITE_SUPABASE_URL) {
    throw new Error('VITE_SUPABASE_URL não está definida');
  }
  if (!env.VITE_SUPABASE_ANON_KEY) {
    throw new Error('VITE_SUPABASE_ANON_KEY não está definida');
  }
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    build: {
      minify: 'esbuild',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['@headlessui/react', '@heroicons/react'],
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'icon.svg') {
              return 'icon.svg';
            }
            return 'assets/[name]-[hash].[ext]';
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      sourcemap: false,
      assetsDir: 'assets',
    },
    server: {
      port: 3000,
      host: true,
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
  };
});
