import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { getPublicEnvIssues } from './config/publicEnv'

const portalNodeModules = path.resolve(__dirname, 'node_modules')

export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const issues = getPublicEnvIssues(loadEnv(mode, __dirname, 'VITE_'));
    if (issues.length) throw new Error('Portal build blocked: ' + issues.join(' ') + ' Set the public portal variables in the deployment project before rebuilding.');
  }
  return {
  base: '/portal/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      // PortalUpdateNotice owns registration and each tab's refresh consent.
      injectRegister: false,
      manifest: false,
      workbox: {
        skipWaiting: false,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,png,svg,webp,json,ico,txt}'],
      },
    }),
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../src'),
      react: path.resolve(portalNodeModules, 'react'),
      'react/jsx-runtime': path.resolve(portalNodeModules, 'react/jsx-runtime.js'),
      'react/jsx-dev-runtime': path.resolve(portalNodeModules, 'react/jsx-dev-runtime.js'),
      'react-dom': path.resolve(portalNodeModules, 'react-dom'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  server: {
    fs: { allow: [path.resolve(__dirname, '..')] },
  },
  }
})
