import BlogCard from "@/components/BlogCard";
import { getPostsByTag } from "@/lib/serverMethods/blog/postMethods";

export const revalidate = 60;

export default async function page({ params }) {
  const { tag } = await params;
  const posts = await getPostsByTag(tag);

  return (
    <main className="u-main-container u-padding-content-container">
      <h1 className="t-main-title">Articles tagged with #{tag} 🏷</h1>
      <p className="t-main-subtitle">
        Explore articles categorized under the #{tag} tag.
      </p>
      <p className="mr-4 text-md text-zinc-900">Latest Articles</p>
      <ul className="u_articles_grid">
        {posts.length > 0 ? (
          posts.map((post) => <BlogCard key={post._id} post={post} />)
        ) : (
          <li>No articles found for this tag 🤖.</li>
        )}
      </ul>
    </main>
  );
}
