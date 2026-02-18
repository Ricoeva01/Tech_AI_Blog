import NotFound from "@/app/not-found";
import { getPost } from "@/lib/serverMethods/blog/postMethods";
import Image from "next/image";
import Link from "next/link";
import "prism-themes/themes/prism-vsc-dark-plus.css";
import "./article-styles.css";

export default async function page({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) return <NotFound />;

  const plainPost = {
    title: post.title,
    author: {
      userName: post.author.userName,
      normalizedUserName: post.author.normalizedUserName,
    },
    tags: post.tags.map((tag) => ({
      name: tag.name,
      slug: tag.slug,
    })),
    coverImageURL: post.coverImageURL,
    markdownHTMLResult: post.markdownHTMLResult,
  };
  return (
    <main className="u-main-container u-padding-content-container">
      <h1 className="text-4xl font-bold mb-4">{plainPost.title}</h1>
      <p className="mb-6">
        By&nbsp;
        <Link
          href={`/categories/author/${plainPost.author.normalizedUserName}`}
          className="mr-4 underline"
        >
          {plainPost.author.userName}
        </Link>
        {plainPost.tags.map((tag) => (
          <Link
            key={tag.slug}
            href={`/categories/tag/${tag.slug}`}
            className="mr-4 underline text-sm"
          >
            #{tag.name}
          </Link>
        ))}
      </p>
      <Image
        src={plainPost.coverImageURL}
        alt={plainPost.title}
        width={1280}
        height={720}
        className="mb-10 w-full h-auto rounded-lg max-w-4xl mx-auto"
        priority
      />
      <div
        dangerouslySetInnerHTML={{ __html: plainPost.markdownHTMLResult }}
        className="article-styles"
      >
        {/* {plainPost.markdownArticle} */}
      </div>
    </main>
  );
}
