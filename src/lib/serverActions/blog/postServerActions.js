"use server";

import Post from "@/lib/models/post";
import { Tag } from "@/lib/models/tag";
import { sessionInfo } from "@/lib/serverMethods/session/sessionMethods";
import { findOrCreate } from "@/lib/serverMethods/tag/tagMethods";
import { connectToDB } from "@/lib/utils/db/connectDB";
import AppError from "@/lib/utils/errorHandling/customError";
import { areTagSimilar, generateUniqueSlug } from "@/lib/utils/general/utils";
import crypto from "crypto";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import { revalidatePath } from "next/cache";
import Prism from "prismjs";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-markup";
import sharp from "sharp";
import slugify from "slugify";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

export async function addPost(formData) {
  const { title, markdownArticle, tags, coverImage } =
    Object.fromEntries(formData);

  try {
    // Basic validation of the input data
    if (typeof title !== "string" || title.trim().length < 3) {
      throw new AppError("Invalid data.");
    }
    if (
      typeof markdownArticle !== "string" ||
      markdownArticle.trim().length === 0
    ) {
      throw new AppError("Invalid data.");
    }
    await connectToDB();
    // creation of the post is a protected action, we need to check if the user is authenticated before allowing them to create a post
    const session = await sessionInfo();
    if (!session.success) {
      throw new AppError("Unauthorized. Please log in to create a post.");
    }

    // Parallelize independent tasks: Image Upload, Tag Processing, Markdown Processing

    // 1. Image Upload Task
    const imageUploadPromise = (async () => {
      if (!coverImage || !(coverImage instanceof File)) {
        throw new AppError("Invalid data");
      }
      const validImageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!validImageTypes.includes(coverImage.type)) {
        throw new AppError("Invalid data");
      }
      const imageBuffer = Buffer.from(await coverImage.arrayBuffer());
      const { width, height } = await sharp(imageBuffer).metadata();
      if (width > 1280 || height > 720) {
        throw new AppError("Invalid data");
      }
      const uniqueFilename = `${crypto.randomUUID()}_${coverImage.name.trim()}`;
      const uploadURL = `${process.env.BUNNY_STORAGE_HOST}/${process.env.BUNNY_STORAGE_ZONE}/${uniqueFilename}`;
      const publicImageURL = `https://TechInfoPullZone.b-cdn.net/${uniqueFilename}`;

      const response = await fetch(uploadURL, {
        method: "PUT",
        headers: {
          AccessKey: process.env.BUNNY_STORAGE_API_KEY,
          "Content-type": "application/octet-stream",
        },
        body: imageBuffer,
      });

      if (!response.ok) {
        throw new AppError("Error while uploading the image");
      }
      return publicImageURL;
    })();

    // 2. Tag Processing Task
    const tagsPromise = (async () => {
      if (typeof tags !== "string") {
        throw new AppError("Invalid data.");
      }

      const tagNamesArray = JSON.parse(tags);
      if (!Array.isArray(tagNamesArray)) {
        throw new AppError("Invalid data.");
      }

      return await Promise.all(
        tagNamesArray.map(async (tagName) => {
          const normalizedTagName = tagName.trim().toLowerCase();
          let tag = await Tag.findOne({ name: normalizedTagName });

          if (!tag) {
            tag = await Tag.create({
              name: normalizedTagName,
              slug: slugify(normalizedTagName, { strict: true }),
            });
          }
          return tag._id;
        }),
      );
    })();

    // 3. Markdown Processing Task
    const markdownPromise = (async () => {
      marked.use(
        markedHighlight({
          highlight: (code, language) => {
            const validLanguage = Prism.languages[language]
              ? language
              : "markup";
            return Prism.highlight(
              code,
              Prism.languages[validLanguage],
              validLanguage,
            );
          },
        }),
      );

      let html = marked(markdownArticle);
      return DOMPurify.sanitize(html);
    })();

    // Wait for all parallel tasks to complete
    const [publicImageURL, tagIds, markdownHTMLResult] = await Promise.all([
      imageUploadPromise,
      tagsPromise,
      markdownPromise,
    ]);

    const newPost = new Post({
      title,
      markdownArticle,
      markdownHTMLResult,
      tags: tagIds,
      coverImageURL: publicImageURL,
      author: session.userId, // Assuming session contains userId of the authenticated user
    });
    const savedPost = await newPost.save();
    console.log("Post saved successfully:", newPost);
    return { success: true, slug: savedPost.slug };
  } catch (err) {
    console.error("Error saving post:", err);
    if (err instanceof AppError) {
      throw err; // Re-throw custom errors to be handled by the caller
    } else {
      throw new AppError("Failed to save post"); // Wrap other errors in a generic AppError
    }
  }
}

export async function editPost(formData) {
  const { postToEditStringify, title, markdownArticle, tags, coverImage } =
    Object.fromEntries(formData);
  const postToEdit = JSON.parse(postToEditStringify);
  try {
    await connectToDB();
    const session = await sessionInfo();
    if (!session.success) {
      throw new AppError("Unauthorized. Please log in to edit a post.");
    }
    const updatedData = {};
    if (typeof title !== "string" || title.trim().length < 3) {
      throw new AppError("Invalid data.");
    }
    if (title.trim() !== postToEdit.title) {
      updatedData.title = title;
      updatedData.slug = await generateUniqueSlug(title);
    }
    if (
      typeof markdownArticle !== "string" ||
      markdownArticle.trim().length === 0
    ) {
      throw new AppError("Invalid data.");
    }
    if (markdownArticle.trim() !== postToEdit.markdownArticle) {
      updatedData.markdownHTMLResult = DOMPurify.sanitize(
        marked(markdownArticle),
      );
      updatedData.markdownArticle = markdownArticle;
    }
    if (typeof coverImage !== "object") throw new Error("Invalid data");
    if (coverImage.size > 0) {
      const validImageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!validImageTypes.includes(coverImage.type)) {
        throw new AppError("Invalid data");
      }
      const imageBuffer = Buffer.from(await coverImage.arrayBuffer());
      const { width, height } = await sharp(imageBuffer).metadata();
      if (width > 1280 || height > 720) {
        throw new AppError("Invalid data");
      }
      // Delete Image
      const toDeleteImageFileName = postToEdit.coverImageURL.split("/").pop();
      const deleteURL = `${process.env.BUNNY_STORAGE_HOST}/${process.env.BUNNY_STORAGE_ZONE}/${toDeleteImageFileName}`;
      const imageDeletionReponse = await fetch(deleteURL, {
        method: "DELETE",
        headers: {
          AccessKey: process.env.BUNNY_STORAGE_API_KEY,
        },
      });
      if (!imageDeletionReponse.ok) {
        console.warn(
          `Failed to delete cover image ${imageDeletionReponse.statusText}.`,
        );
      }
      //Upload new image
      const ImagetoUploadFileName = `${crypto.randomUUID()}_${coverImage.name.trim()}`;
      const imageuploadURL = `${process.env.BUNNY_STORAGE_HOST}/${process.env.BUNNY_STORAGE_ZONE}/${ImagetoUploadFileName}`;
      const imagePublicURL = `https://TechInfoPullZone.b-cdn.net/${ImagetoUploadFileName}`;

      const imageToUploadResponse = await fetch(imageuploadURL, {
        method: "PUT",
        headers: {
          AccessKey: process.env.BUNNY_STORAGE_API_KEY,
          "Content-type": "application/octet-stream",
        },
        body: imageBuffer,
      });
      if (!imageToUploadResponse.ok) {
        throw new AppError("Error while uploading the image");
      }
      updatedData.coverImageURL = imagePublicURL;
    }
    //Tags Management
    if (typeof tags !== "string") {
      throw new AppError("Invalid data.");
    }
    const tagNameArray = JSON.parse(tags);
    if (!Array.isArray(tagNameArray)) {
      throw new AppError("Invalid data.");
    }
    if (!areTagSimilar(tagNameArray, postToEdit.tags)) {
      const tagIds = await Promise.all(
        tagNameArray.map((tag) => findOrCreate(tag)),
      );
      updatedData.tags = tagIds;
    }
    if (Object.keys(updatedData).length === 0)
      throw new AppError("Invalid data.");

    const updatedPost = await Post.findByIdAndUpdate(
      postToEdit._id,
      updatedData,
      { new: true },
    );
    revalidatePath(`/articles/${postToEdit.slug}`);

    return { success: true, slug: updatedPost.slug };
  } catch (err) {
    console.error("Error updating post:", err);
    if (err instanceof AppError) {
      throw err; // Re-throw custom errors to be handled by the caller
    } else {
      throw new AppError("Failed to update and save post"); // Wrap other errors in a generic AppError
    }
  }
}

export async function deletePostById(id) {
  try {
    await connectToDB();
    const user = await sessionInfo();
    if (!user.success) {
      throw new AppError("Unauthorized. Please log in to delete a post.");
    }
    const post = await Post.findById(id);
    if (!post) {
      throw new AppError("Post not found.");
    }

    await Post.findByIdAndDelete(id);
    if (post.coverImageURL) {
      const imageKey = post.coverImageURL.split("/").pop();
      const deleteURL = `${process.env.BUNNY_STORAGE_HOST}/${process.env.BUNNY_STORAGE_ZONE}/${imageKey}`;
      const response = await fetch(deleteURL, {
        method: "DELETE",
        headers: {
          AccessKey: process.env.BUNNY_STORAGE_API_KEY,
        },
      });
      if (!response.ok) {
        throw new AppError(
          `Failed to delete cover image ${response.statusText}.`,
        );
      }
    }
    revalidatePath(`/articles/${post.slug}`);
    revalidatePath("/");
    revalidatePath(`/dashboard/${post.author}`);

    return { success: true };
  } catch (err) {
    console.error("Error deleting post:", err);
    if (err instanceof AppError) {
      throw err; // Re-throw custom errors to be handled by the caller
    } else {
      throw new AppError("Failed to delete post"); // Wrap other errors in a generic AppError
    }
  }
}
