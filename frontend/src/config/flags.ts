// Owner: manager. Feature flags. Flip only with the owner's approval (approved design §5.14).
export const flags = {
  /** Touch-device stickman walker. Off in production until the owner tunes it in the lab page. */
  touchStickman: false,
} as const satisfies Record<string, boolean>;
