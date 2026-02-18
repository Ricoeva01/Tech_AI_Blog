import BlogCard from "@/components/BlogCard";
import { getAllPosts } from "@/lib/serverMethods/blog/postMethods";

export const revalidate = 60;

export default async function Home() {
  const posts = await getAllPosts();
  const plainPosts = posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    author: {
      userName: post.author.userName,
      normalizedUserName: post.author.normalizedUserName,
    },
    createdAt: post.createdAt.toISOString(),
    coverImageURL: post.coverImageURL,
  }));
  return (
    <div className=" u-main-container u-padding-content-container">
      <h1 className="t-main-title">Stay up to date with TechIA Blog</h1>
      <p className="t-main-subtitle">Tech news for everyday</p>
      <p className="text-md text-zinc-900">Latest Articles</p>
      <ul className="u_articles_grid">
        {plainPosts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </ul>
    </div>
  );
}
