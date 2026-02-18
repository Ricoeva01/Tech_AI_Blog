import Image from "next/image";
import Link from "next/link";

function BlogCard({ post }) {
  return (
    <li
      key={post.id}
      className="rounded-3xl shadow-md hover:shadow-xl border hover:border-zinc-300 overflow-hidden"
    >
      {post.coverImageURL && (
        <Link href={`/articles/${post.slug}`}>
          <Image
            src={post.coverImageURL}
            width={340}
            height={190}
            alt={post.title}
            className="object-cover relative w-full h-48 rounded-t-3xl cursor-pointer"
          />
        </Link>
      )}
      <div className="pt-5 px-5 pb-7">
        <div className="flex items-baseline gap-x-4 text-xs">
          <time
            dateTime={new Date().toISOString()}
            className="text-gray-500 text-sm"
          >
            {new Date(post.createdAt).toLocaleDateString("en-EN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <Link
            href={`/categories/author/${post.author.normalizedUserName}`}
            className="ml-auto text-base text-gray-700 hover:text-gray-600 whitespace-nowrap truncate"
          >
            {post.author.userName}
          </Link>
        </div>
        <Link
          href={`/articles/${post.slug}`}
          className="inline-block mt-6 text-xl font-semibold text-zinc-800 hover:text-zinc-600"
        >
          {post.title}
        </Link>
      </div>
    </li>
  );
}
export default BlogCard;
