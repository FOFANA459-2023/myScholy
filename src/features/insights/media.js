import { imageUrl } from "../../lib/api/endpoints.js";

/**
 * The cover to show for an article, if it has one.
 *
 * A piece can carry either an uploaded cover (`cover`, a stored image id) or a
 * link to one hosted elsewhere (`cover_image`, the older field). The upload
 * wins when both are set - it is the one an admin chose most recently, and it
 * is served from our own origin with the metadata already stripped.
 */
export function coverUrlOf(article) {
  return imageUrl(article?.cover) || article?.cover_image || null;
}
