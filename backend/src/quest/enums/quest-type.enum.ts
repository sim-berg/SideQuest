/**
 * The four quest flavors:
 *  - PERSONAL: solo quests — user-created map quests, worker-spawned side
 *    quests and the daily Logbuch board.
 *  - EVENT: user-organized meetups (e.g. einen Park säubern). The creator
 *    stakes coins into escrow; whoever stays in the area long enough claims a
 *    share.
 *  - WORLD: bigger events organized by outside firms. Completed by scanning a
 *    QR code on site, redeemable once per user.
 *  - COMMUNITY: guild quests where members confirm each other by scanning
 *    each other's QR codes. Guild system pending — enum reserved.
 */
export enum QuestType {
  PERSONAL = 'personal',
  EVENT = 'event',
  WORLD = 'world',
  COMMUNITY = 'community',
}
