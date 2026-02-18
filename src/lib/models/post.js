import mongoose from "mongoose";
// Import slugify to generate URL-friendly slugs from post titles
import slugify from "slugify";
// Define the post schema with title, markdownArticle, and slug fields and enable timestamps for createdAt and updatedAt
import "./tag.js";
import "./user.js";

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    markdownArticle: { type: String, required: true },
    markdownHTMLResult: {
      type: String,
      required: true,
    },
    slug: { type: String, unique: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
    coverImageURL: { type: String, required: true },
  },

  { timestamps: true },
);
// Middleware to generate a unique slug before saving a post
postSchema.pre("save", async function (next) {
  if (!this.slug) {
    let slugCandidate = slugify(this.title, { lower: true, strict: true });
    let slugExists = await mongoose.models.Post.findOne({
      slug: slugCandidate,
    });
    let suffix = 1;
    while (slugExists) {
      slugCandidate = `${slugCandidate}-${suffix}`;
      slugExists = await mongoose.models.Post.findOne({ slug: slugCandidate });
      suffix++;
    }
    this.slug = slugCandidate;
    console.log(`Generated slug: ${this.slug}`);
  }
  next();
});
export default mongoose.models?.Post || mongoose.model("Post", postSchema);
