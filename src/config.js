/*
 * CHS Career Spin — configuration
 *
 * STORAGE MODE
 *   Leave SUPABASE_URL / SUPABASE_ANON_KEY empty to run in "local" mode:
 *   everything is saved in this browser only (fine for a single booth kiosk).
 *
 *   To enforce "1 email = 1 spin" across EVERY phone/device (QR-code play),
 *   create a free Supabase project, run supabase/schema.sql in its SQL editor,
 *   then put the project URL and anon key in a .env file (see .env.example).
 */
const CONFIG = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || "",
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || "",

  // Admin password for LOCAL mode only. In shared (Supabase) mode the password
  // is set in supabase/schema.sql and checked by the database instead.
  // The address players open. The QR code always points here.
  PUBLIC_URL: "https://chs-career-spin.onrender.com/",

  ADMIN_PASSWORD: "cyberfair2026",

  // Starting prize stock (used the first time the game runs / after setup).
  DEFAULT_STOCK: {
    "Tracks Fidget": 60,
    "Controller Fidget": 78,
    "Ballpen": 100,
    "Notebook": 100,
  },

  // When a player answers correctly, prizes are drawn from the first tier that
  // still has stock; otherwise the topic's own prize is used.
  PRIZE_TIERS: [
    ["Controller Fidget", "Tracks Fidget"],
    ["Ballpen", "Notebook"],
  ],

  JACKPOT_PRIZE: "Mystery prize (Jackpot)",
};
export default CONFIG;
