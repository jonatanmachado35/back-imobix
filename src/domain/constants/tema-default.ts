/**
 * Tema padrão da plataforma Imobix.
 * Baseado em app/globals.css — sincronizado entre dispositivos via campo `tema` do User.
 *
 * O frontend deve fazer JSON.parse(user.tema) para ler os tokens,
 * e JSON.stringify(temaConfig) antes de enviar via PATCH /profile.
 */
export const TEMA_DEFAULT = {
  mode: 'light',

  // ── Cores globais ────────────────────────────────────────────────────────
  background: 'oklch(1 0 0)',
  foreground: 'hsl(0, 0%, 4%)',

  card: 'oklch(1 0 0)',
  cardForeground: 'oklch(0.145 0 0)',

  popover: 'oklch(1 0 0)',
  popoverForeground: 'oklch(0.145 0 0)',

  primary: 'oklch(0.68 0.19 50)',
  primaryForeground: 'oklch(1 0 0)',

  secondary: 'oklch(0.97 0 0)',
  secondaryForeground: 'oklch(0.205 0 0)',

  muted: 'oklch(0.97 0 0)',
  mutedForeground: 'oklch(0.556 0 0)',

  accent: 'oklch(0.97 0 0)',
  accentForeground: 'oklch(0.205 0 0)',

  destructive: 'oklch(0.577 0.245 27.325)',

  border: 'oklch(0.922 0 0)',
  input: 'oklch(0.922 0 0)',
  ring: 'oklch(0.68 0.19 50)',

  // ── Sidebar ──────────────────────────────────────────────────────────────
  sidebar: 'oklch(0.205 0.014 264)',
  sidebarForeground: 'oklch(0.985 0 0)',
  sidebarPrimary: 'oklch(0.68 0.19 50)',
  sidebarPrimaryForeground: 'oklch(1 0 0)',
  sidebarAccent: 'oklch(0.269 0.014 264)',
  sidebarAccentForeground: 'oklch(0.985 0 0)',
  sidebarBorder: 'oklch(0.322 0.014 264)',
  sidebarRing: 'oklch(0.68 0.19 50)',

  // ── Border Radius ────────────────────────────────────────────────────────
  radius: '0.625rem',

  // ── Charts ───────────────────────────────────────────────────────────────
  chart1: 'oklch(0.68 0.19 50)',
  chart2: 'oklch(0.6 0.118 184.704)',
  chart3: 'oklch(0.398 0.07 227.392)',
  chart4: 'oklch(0.828 0.189 84.429)',
  chart5: 'oklch(0.769 0.188 70.08)',
};

/** String JSON pronta para persistir no banco (campo `tema` do User) */
export const TEMA_DEFAULT_JSON = JSON.stringify(TEMA_DEFAULT);
