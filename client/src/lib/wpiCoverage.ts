export const WPI_COVERAGE = [
  {
    flag: "🏔️",
    province: "British Columbia",
    detail: "EOCP · WPI exams",
    supportingText: "~4,200 operators",
    color: "#0891B2",
    colorBg: "rgba(8,145,178,0.1)",
    colorBorder: "rgba(8,145,178,0.25)",
  },
  {
    flag: "🛢️",
    province: "Alberta",
    detail: "AWWOA · WPI exams",
    supportingText: "~2,071 operators",
    color: "#7C3AED",
    colorBg: "rgba(124,58,237,0.1)",
    colorBorder: "rgba(124,58,237,0.25)",
  },
  {
    flag: "🌾",
    province: "Saskatchewan",
    detail: "SAHO · WPI exams",
    supportingText: "~800 operators",
    color: "#D97706",
    colorBg: "rgba(217,119,6,0.1)",
    colorBorder: "rgba(217,119,6,0.25)",
  },
  {
    flag: "🦬",
    province: "Manitoba",
    detail: "MWWA · WPI exams",
    supportingText: "~600 operators",
    color: "#059669",
    colorBg: "rgba(5,150,105,0.1)",
    colorBorder: "rgba(5,150,105,0.25)",
  },
  {
    flag: "🌊",
    province: "Nova Scotia",
    detail: "NSECC · Shared WPI preparation",
    supportingText: "14 eligible WPI courses",
    color: "#2563EB",
    colorBg: "rgba(37,99,235,0.1)",
    colorBorder: "rgba(37,99,235,0.25)",
  },
] as const;

export const WPI_PROVINCE_COUNT = WPI_COVERAGE.length;
