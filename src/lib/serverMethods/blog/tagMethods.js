import { Tag } from "@/lib/models/tag";
import { connectToDB } from "@/lib/utils/db/connectDB";

export async function getTags() {
  try {
    await connectToDB();
    const tags = await Tag.aggregate([
      {
        $lookup: {
          from: "posts",
          localField: "_id",
          foreignField: "tags",
          as: "postsWithTag",
        },
      },
      {
        $addFields: {
          postCount: { $size: "$postsWithTag" },
        },
      },
      {
        $match: {
          postCount: { $gt: 0 },
        },
      },
      {
        $sort: { postCount: -1 },
      },
      {
        $project: {
          postsWithTag: 0,
        },
      },
    ]);
    return tags;
  } catch (err) {
    console.error("Error fetching tags:", err);
    throw new Error("Failed to fetch tags");
  }
}
