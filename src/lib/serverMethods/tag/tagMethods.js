import { Tag } from "@/lib/models/tag";
import slugify from "slugify";

export async function findOrCreate(tagName) {
  const tagSlug = slugify(tagName, { lower: true, strict: true });
  let tag = await Tag.findOne({ name: tagSlug });
  if (!tag) {
    tag = await Tag.create({
      name: tagName,
      slug: tagSlug,
    });
  }
  return tag._id;
}
