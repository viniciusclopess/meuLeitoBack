function nowFortaleza() {
  const now = new Date();

  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const formatted = fmt.format(now); 
  // Normalmente vem "2025-12-02, 21:28:13" ou "2025-12-02 21:28:13" dependendo do ambiente

  const cleaned = formatted.replace(",", ""); // tira vírgula se tiver

  // Garante "YYYY-MM-DD HH:mm:ss"
  return cleaned.trim();
}

module.exports = { nowFortaleza };
