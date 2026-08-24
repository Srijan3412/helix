import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "prefer-const": "warn",
      "no-useless-escape": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "no-empty": "warn",
    },
    ignores: ['dist', 'node_modules'],
  }
);
