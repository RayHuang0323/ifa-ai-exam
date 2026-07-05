// 統一管理 IFA Master Coach 專案的 Design Tokens (Tailwind Class 映射)
// 確保全站呈現 Medical, Minimal, Professional, Premium 的一致性風格

export const tokens = {
  colors: {
    // 品牌主色 (Medical / Professional Blue)
    primary: {
      main: "indigo-600",
      bg: "bg-indigo-600",
      hover: "hover:bg-indigo-700",
      text: "text-indigo-600",
      border: "border-indigo-600",
      lightBg: "bg-indigo-50/50",
      lightBorder: "border-indigo-100/75"
    },
    // 次要與文字色 (Premium Slate)
    secondary: {
      main: "slate-900",
      bg: "bg-slate-900",
      hover: "hover:bg-slate-800",
      text: "text-slate-900",
      textMuted: "text-slate-500",
      border: "border-slate-200/75",
      lightBg: "bg-slate-50",
      pageBg: "bg-[#F9FAFB]"
    },
    // 提示與狀態色
    status: {
      warningText: "text-amber-500",
      warningBg: "bg-amber-50/50",
      warningBorder: "border-amber-100",
      dangerText: "text-red-600",
      dangerBg: "bg-red-50",
      successText: "text-emerald-600",
      successBg: "bg-emerald-50"
    }
  },
  layout: {
    page: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8",
    section: "py-8 sm:py-12",
    flexCenter: "flex items-center justify-center",
    flexBetween: "flex items-center justify-between"
  },
  cards: {
    // 高級卡片 (Stripe / Linear 風格)
    base: "bg-white border border-slate-200/75 rounded-2xl shadow-sm",
    // 玻璃擬態 (適度使用於 Header / 懸浮選單)
    glass: "bg-white/90 backdrop-blur-md border border-slate-200/75 rounded-2xl shadow-sm z-10",
    // 互動式卡片 (選項、按鈕式卡片)
    interactive: "bg-white border border-slate-200/75 rounded-2xl shadow-sm transition-all duration-200 ease-out hover:border-indigo-300 hover:shadow-md cursor-pointer active:scale-[0.99]",
    // 選中的卡片
    selected: "bg-indigo-50/30 border-indigo-600 text-indigo-900 shadow-[0_0_0_1px_rgba(79,70,229,1)] rounded-2xl transition-all duration-200"
  },
  buttons: {
    // 主要行動呼籲 (Dark/Premium 風格)
    primary: "flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-sm text-sm active:scale-[0.98]",
    // 次要行動
    secondary: "flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-medium py-3 px-6 rounded-xl transition-all duration-200 text-sm active:scale-[0.98]",
    // 強調行動 (藍色)
    accent: "flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-sm shadow-indigo-200 text-sm active:scale-[0.98]",
    // 禁用狀態
    disabled: "opacity-40 cursor-not-allowed pointer-events-none"
  },
  typography: {
    h1: "text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight",
    h2: "text-xl sm:text-2xl font-bold text-slate-900 leading-tight",
    h3: "text-sm font-semibold text-slate-900",
    body: "text-sm text-slate-600 leading-relaxed",
    mono: "font-mono tracking-tight",
    label: "text-[11px] font-bold tracking-widest uppercase text-slate-400"
  }
};