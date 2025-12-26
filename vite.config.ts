import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

// 解析代理配置
// 格式: [["/api", "http://localhost:3000"], ["/ws", "http://localhost:3001"]]
function createProxy(proxyStr: string) {
  if (!proxyStr) return {};

  try {
    const proxyList: [string, string][] = JSON.parse(proxyStr);
    const proxy: Record<string, object> = {};

    for (const [prefix, target] of proxyList) {
      proxy[prefix] = {
        target,
        changeOrigin: true,
        ws: prefix.includes('ws'), // WebSocket 支持
      };
    }
    return proxy;
  } catch {
    console.warn('[Vite] VITE_PROXY 格式错误，请检查配置');
    return {};
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            // 告诉 Vue 编译器 iconpark-icon 是自定义元素，不需要解析
            isCustomElement: (tag) => tag === 'iconpark-icon',
          },
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: createProxy(env.VITE_PROXY),
    },
  };
});
