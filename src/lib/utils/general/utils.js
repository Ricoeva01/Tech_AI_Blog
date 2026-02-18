import Post from "@/lib/models/post";
import slugify from "slugify";

export async function generateUniqueSlug(title) {
  let slugCandidate = slugify(title, { lower: true, strict: true });
  let slugExists = await Post.findOne({ slug: slugCandidate });
  let counter = 1;
  while (slugExists) {
    slugCandidate = `${slugCandidate}-${counter}`;
    slugExists = await Post.findOne({ slug: slugCandidate });
    counter++;
  }
  return slugCandidate;
}

export function areTagSimilar(userTagArray, DBTagsArray) {
  if (userTagArray.length !== DBTagsArray.length) return false;
  const normalize = (tag) =>
    typeof tag === "object" && tag !== null && tag.name ? tag.name : tag;
  const sortedUserTagsArray = [...userTagArray].map(normalize).sort();
  const sortedDBTagsArray = [...DBTagsArray].map(normalize).sort();
  return sortedUserTagsArray.every(
    (tag, index) => tag === sortedDBTagsArray[index],
  );
}
