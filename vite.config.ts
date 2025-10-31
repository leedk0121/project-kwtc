import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 프로덕션 빌드 최적화
    minify: 'esbuild', // terser 대신 esbuild 사용 (빠르고 안정적)
    // 청크 크기 경고 임계값 (기본 500kb)
    chunkSizeWarningLimit: 1000,
    // 코드 스플리팅 최적화
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'calendar': ['react-calendar', 'react-big-calendar', 'date-fns'],
        },
      },
    },
  },
  // 개발 서버 설정
  server: {
    port: 5173,
    open: true,
  },
  // TypeScript 빌드 경고 무시 (배포 우선)
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
})
