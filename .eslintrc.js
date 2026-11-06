module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    'no-console': 'warn',
  },
  overrides: [
    {
      files: ['src/core/**/*.{ts,tsx,js,jsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['@/features/**', '**/features/**'],
                message: 'src/core must not import from src/features.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['src/features/**/*.{ts,tsx,js,jsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['@/features/*/**'],
                message:
                  "A feature may only import other features through their root index.ts (e.g. '@/features/<name>').",
              },
            ],
          },
        ],
      },
    },
  ],
};
