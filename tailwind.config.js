/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        /** 课时3海报预览：Cormorant + Noto 栈（与先前 Google Fonts 搭配一致；拉丁数字等走 Cormorant，中文走 Noto） */
        "poster-display": ['"Cormorant Garamond"', '"Noto Serif SC"', "ui-serif", "serif"],
        /** 课时3海报预览：纯中文衬线（@fontsource/noto-serif-sc） */
        "poster-sc": ['"Noto Serif SC"', "ui-serif", "serif"],
        /** 课时3海报预览：英文装饰（@fontsource/cormorant-garamond） */
        "poster-en": ['"Cormorant Garamond"', "ui-serif", "serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        /** 课时3 海报「为何关注」外圈光晕脉冲（与 ring 并存，只动 filter） */
        "poster-glow-amber": {
          "0%, 100%": {
            filter:
              "drop-shadow(0 2px 10px rgba(251, 191, 36, 0.24)) drop-shadow(0 0 8px rgba(245, 158, 11, 0.2))",
          },
          "50%": {
            filter:
              "drop-shadow(0 5px 26px rgba(251, 191, 36, 0.58)) drop-shadow(0 0 22px rgba(245, 158, 11, 0.48))",
          },
        },
        /** 课时3 海报「我们看见了什么」外圈光晕脉冲 */
        "poster-glow-emerald": {
          "0%, 100%": {
            filter:
              "drop-shadow(0 2px 10px rgba(52, 211, 153, 0.22)) drop-shadow(0 0 8px rgba(16, 185, 129, 0.18))",
          },
          "50%": {
            filter:
              "drop-shadow(0 5px 26px rgba(52, 211, 153, 0.52)) drop-shadow(0 0 22px rgba(16, 185, 129, 0.42))",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "poster-glow-amber": "poster-glow-amber 2.6s ease-in-out infinite",
        "poster-glow-emerald": "poster-glow-emerald 2.6s ease-in-out 0.75s infinite",
      },
    },
  },
  plugins: [],
}
