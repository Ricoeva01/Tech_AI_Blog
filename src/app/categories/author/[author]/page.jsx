import BlogCard from "@/components/BlogCard";
import { getPostsByAuthor } from "@/lib/serverMethods/blog/postMethods";

export const revalidate = 60;

export default async function page({ params }) {
  const { author } = await params;
  const { posts, author: authorInfo } = await getPostsByAuthor(author);

  return (
    <main className="u-main-container u-padding-content-container">
      <h1 className="t-main-title">Articles by {authorInfo.userName} 🧑‍💻</h1>
      <p className="t-main-subtitle">
        Explore articles written by {authorInfo.userName}.
      </p>
      <p className="mr-4 text-md text-zinc-900">Latest Articles</p>
      <ul className="u_articles_grid">
        {posts.length > 0 ? (
          posts.map((post) => <BlogCard key={post._id} post={post} />)
        ) : (
          <li>No articles found for this author 🤖.</li>
        )}
      </ul>
    </main>
  );
}
