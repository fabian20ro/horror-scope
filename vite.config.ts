import { defineConfig, type Plugin } from 'vite';

const THREE_MINUTES_CACHE_HEADER = 'public, max-age=180';
const NO_CACHE_HEADER = 'no-cache, max-age=0, must-revalidate';

function cacheHeadersPlugin(): Plugin {
  const applyCacheHeaders = (url: string | undefined, setHeader: (name: string, value: string) => void) => {
    if (!url) return;

    const pathname = url.split('?')[0];

    if (pathname === '/' || pathname.endsWith('/index.html') || pathname.endsWith('/sw.js')) {
      setHeader('Cache-Control', NO_CACHE_HEADER);
      return;
    }

    const isShortCachedStatic =
      pathname.includes('/assets/') ||
      pathname.includes('/data/') ||
      pathname.endsWith('/favicon.svg') ||
      pathname.endsWith('/manifest.webmanifest');

    if (isShortCachedStatic) {
      setHeader('Cache-Control', THREE_MINUTES_CACHE_HEADER);
    }
  };

  return {
    name: 'cache-headers',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        applyCacheHeaders(req.url, (name, value) => res.setHeader(name, value));
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        applyCacheHeaders(req.url, (name, value) => res.setHeader(name, value));
        next();
      });
    },
  };
}

export default defineConfig({
  base: '/horror-scope/',
  plugins: [cacheHeadersPlugin()],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
