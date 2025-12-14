/**
 * ESLint 配置 (Flat Config)
 */
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import vue from 'eslint-plugin-vue'

export default [
  // 忽略文件
  {
    ignores: ['dist/**', 'node_modules/**'],
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
      },
    },
    rules: {
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
      'vue/script-indent': ['warn', 2, { baseIndent: 0 }],
      // 关闭一些过于严格的格式规则（交给 Prettier 处理）
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-indent': 'off',
      'vue/first-attribute-linebreak': 'off',
      'vue/html-closing-bracket-newline': 'off',
    },
  },
]
