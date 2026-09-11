import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      '@next/next/no-img-element': 'off',
      'react/no-unescaped-entities': 'off'
    }
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'coverage/**']
  }
];

export default eslintConfig;
