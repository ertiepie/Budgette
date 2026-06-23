export const accountOptions = [
  "Apple Card",
  "Chase Visa",
  "CCU Checking",
] as const;

export type Account = (typeof accountOptions)[number];
