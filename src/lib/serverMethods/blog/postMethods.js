import Post from "@/lib/models/post";
import { Tag } from "@/lib/models/tag";
import { User } from "@/lib/models/user";
import { connectToDB } from "@/lib/utils/db/connectDB";
import { notFound } from "next/navigation";

export const dynamic = "force-static";

export async function getPost(slug) {
  await connectToDB();

  const post = await Post.findOne({ slug })
    .populate({
      path: "author",
      select: "userName normalizedUserName",
    })
    .populate({
      path: "tags",
      select: "name slug",
    });

  if (!post) return null;

  return post;
}

export async function getAllPosts() {
  await connectToDB();
  const posts = await Post.find({})
    .select("title slug createdAt author coverImageURL")
    .populate({
      path: "author",
      select: "userName normalizedUserName",
    })
    .sort({ createdAt: -1 });

  return posts;
}

export async function getPostForEdit(id) {
  await connectToDB();

  const post = await Post.findOne({ _id: id })
    .populate({
      path: "author",
      select: "userName normalizedUserName",
    })
    .populate({
      path: "tags",
      select: "name slug",
    });

  if (!post) return notFound();

  return post;
}

export async function getUserPostsFromUserId(userId) {
  await connectToDB();
  const posts = await Post.find({ author: userId })
    .select("title _id slug")
    .sort({ createdAt: -1 });

  return posts;
}

export async function getPostsByTag(tagSlug) {
  await connectToDB();
  const tag = await Tag.findOne({ slug: tagSlug });

  if (!tag) return notFound();

  const posts = await Post.find({ tags: tag._id })
    .populate({ path: "author", select: "userName normalizedUserName" })
    .select("title slug createdAt coverImageURL")
    .sort({ createdAt: -1 });

  return posts;
}

export async function getPostsByAuthor(normalizedUserName) {
  await connectToDB();
  const author = await User.findOne({ normalizedUserName });

  if (!author) return notFound();

  const posts = await Post.find({ author: author._id })
    .populate({ path: "author", select: "userName normalizedUserName" })
    .select("title slug createdAt coverImageURL")
    .sort({ createdAt: -1 });

  return { posts, author };
}

export async function getPostForEditPost(id) {
  await connectToDB();
  const post = await Post.findOne({ _id: id })
    .populate({
      path: "author",
      select: "userName normalizedUserName",
    })
    .populate({
      path: "tags",
      select: "name slug",
    });

  if (!post) return notFound();

  return post;
}
