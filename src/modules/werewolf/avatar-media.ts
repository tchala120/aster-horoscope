/** Animated previews available for selected Werewolf character portraits. */
export const AVATAR_VIDEOS: Readonly<Record<string, string>> = {
  "/werewolf-game/avatar/icon_11.png": "/werewolf-game/avatar/icon-11.mp4",
  "/werewolf-game/avatar/icon_12.png": "/werewolf-game/avatar/icon-12.mp4",
  "/werewolf-game/avatar/icon_14.png": "/werewolf-game/avatar/icon-14.mp4",
  "/werewolf-game/avatar/icon_15.png": "/werewolf-game/avatar/icon-15.mp4",
  "/werewolf-game/avatar/icon_16.png": "/werewolf-game/avatar/icon-16.mp4",
  "/werewolf-game/avatar/icon_17.png": "/werewolf-game/avatar/icon-17.mp4",
  "/werewolf-game/avatar/icon_18.png": "/werewolf-game/avatar/icon-18.mp4",
  "/werewolf-game/avatar/icon_19.png": "/werewolf-game/avatar/icon-19.mp4",
};

export function avatarVideoFor(avatar?: string): string | undefined {
  return avatar ? AVATAR_VIDEOS[avatar] : undefined;
}
