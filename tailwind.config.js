/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          1: 'var(--color-bg-1)',
          2: 'var(--color-bg-2)',
          3: 'var(--color-bg-3)',
          4: 'var(--color-bg-4)',
          5: 'var(--color-bg-5)',
        },
        text: {
          1: 'var(--color-text-1)',
          2: 'var(--color-text-2)',
          3: 'var(--color-text-3)',
          4: 'var(--color-text-4)',
        },
        border: {
          1: 'var(--color-border-1)',
          2: 'var(--color-border-2)',
        },
        primary: {
          1: 'var(--arco-blue-1)',
          2: 'var(--arco-blue-2)',
          3: 'var(--arco-blue-3)',
          4: 'var(--arco-blue-4)',
          5: 'var(--arco-blue-5)',
          6: 'var(--arco-blue-6)',
          7: 'var(--arco-blue-7)',
          8: 'var(--arco-blue-8)',
          9: 'var(--arco-blue-9)',
          10: 'var(--arco-blue-10)',
        }
      }
    },
  },
  plugins: [],
}

