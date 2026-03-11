import coreWebVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
  ...coreWebVitals,
  {
    rules: {
      'react/no-unescaped-entities': 'warn',
      '@next/next/no-html-link-for-pages': 'warn',
      '@next/next/no-img-element': 'warn',
    },
  },
];

export default eslintConfig;
