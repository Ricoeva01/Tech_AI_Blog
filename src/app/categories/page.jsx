import { getTags } from "@/lib/serverMethods/blog/tagMethods";
import Link from "next/link";

export const revalidate = 60;

export default async function page() {
  const tags = await getTags();
  console.log("tagsList:", tags);

  return (
    <main className="u-main-container u-padding-content-container">
      <h1 className="t-main-title">All Categories</h1>
      <p className="t-main-subtitle">Find Articles sorted by categories</p>
      <ul className="u_articles_grid">
        {tags.length > 0 ? (
          tags.map((tag) => (
            <li key={tag._id} className=" bg-gray-100 border rounded shadow-md">
              <Link
                href={`/categories/tag/${tag.slug}`}
                className="p-4 pb-6 flex items-baseline"
              >
                <span className="text-lg font-semibold underline">
                  #{tag.name}
                </span>
                <span className="ml-auto">
                  Articles counts :{" "}
                  <span className="font-semibold">{tag.postCount}</span>
                </span>
              </Link>
            </li>
          ))
        ) : (
          <li>No tags found.</li>
        )}
      </ul>
    </main>
  );
}
