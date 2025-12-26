/**
 * ESLint 配置 (Flat Config)
 */
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import vue from 'eslint-plugin-vue';

export default [
  // 忽略文件
  {
    ignores: ['dist/**', 'node_modules/**', 'src/assets/icon/**'],
  },

  // JavaScript 基础规则
  eslint.configs.recommended,

  // TypeScript 规则
  ...tseslint.configs.recommended,

  // Vue 规则
  ...vue.configs['flat/recommended'],

  // 自定义规则
  {
    files: ['**/*.{ts,tsx,vue}'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        // 指定 tsconfig 根目录，解决 monorepo 环境下的问题
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        sessionStorage: 'readonly',
        localStorage: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',
        Event: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // 文件相关全局类型
        File: 'readonly',
        FileList: 'readonly',
        DragEvent: 'readonly',
        FormData: 'readonly',
        // 观察者 API
        IntersectionObserver: 'readonly',
        IntersectionObserverEntry: 'readonly',
        ResizeObserver: 'readonly',
        // 自定义事件
        CustomEvent: 'readonly',
      },
    },
    rules: {
      // 允许 console（开发调试用）
      'no-console': 'off',

      // TypeScript
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',

      // Vue
      'vue/multi-word-component-names': 'off',
      'vue/html-self-closing': [
        'error',
        {
          html: { void: 'always', normal: 'never', component: 'always' },
        },
      ],
      // 模板缩进使用 2 空格
      'vue/html-indent': ['warn', 2],
      'vue/script-indent': ['warn', 2, { baseIndent: 0, switchCase: 1 }],
      // 关闭一些过于严格的格式规则（交给 Prettier 处理）
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-indent': 'off',
      'vue/first-attribute-linebreak': 'off',
      'vue/html-closing-bracket-newline': 'off',
    },
  },
];
