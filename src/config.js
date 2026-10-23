/*
 * CHS Spin Game — configuration
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
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || "https://sordhkgkgyehhdtydkfd.supabase.co",
  // Publishable (public) key: safe in the page; the database is locked by supabase/schema.sql.
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_t2sJPLhtoxXIZ633VhcCZQ_9h--23DE",

  // The address players open. The QR code always points here.
  PUBLIC_URL: "https://chs-spin-game.onrender.com/",

  // Admin password for LOCAL mode only. In shared (Supabase) mode the password
  // is set from the /admin page and checked by the database instead.
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
