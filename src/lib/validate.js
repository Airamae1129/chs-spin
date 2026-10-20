const DISPOSABLE = [
  "mailinator.com", "10minutemail.com", "guerrillamail.com", "yopmail.com", "tempmail.com",
  "temp-mail.org", "throwawaymail.com", "trashmail.com", "sharklasers.com", "getnada.com",
  "dispostable.com", "maildrop.cc", "fakeinbox.com", "example.com", "test.com",
];

export function emailError(e) {
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(e))
    return "Please enter a valid email address (e.g. name@company.com).";
  if (e.includes("..")) return "Please enter a valid email address (no double dots).";
  if (DISPOSABLE.includes(e.split("@")[1].toLowerCase()))
    return "Please use your real email address — temporary inboxes aren't accepted.";
  return "";
}
