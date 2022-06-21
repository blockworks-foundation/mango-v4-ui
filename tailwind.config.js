module.exports = {
  content: ['./pages/**/*.tsx', './components/**/*.tsx'],
  theme: {
    fontFamily: {
      display: ['Lato, sans-serif'],
      body: ['Lato, sans-serif'],
    },
    extend: {
      colors: {
        transparent: 'transparent',
        mango: {
          100: '#efedfe',
          200: '#c6c3db',
          300: '#978fa4',
          400: '#4b475a',
          500: '#464063',
          600: '#393450',
          700: '#1d1832',
          800: '#141026',
          900: '#100d1e',
        },
      },
    },
  },
  plugins: [
    // ...
    require('@tailwindcss/forms'),
  ],
}
