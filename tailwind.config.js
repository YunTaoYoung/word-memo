/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'memory-new': '#EF4444',      // 红色 - NEW
        'memory-familiar': '#F59E0B',  // 橙色 - FAMILIAR
        'memory-learning': '#EAB308',  // 黄色 - LEARNING
        'memory-mastered': '#22C55E',  // 绿色 - MASTERED
        'memory-archived': '#9CA3AF',  // 灰色 - ARCHIVED
      },
    },
  },
  plugins: [],
}
