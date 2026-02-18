import Link from "next/link";
import { getUserPostsFromUserId } from "../../../lib/serverMethods/blog/postMethods";
import DeletePostButton from "./components/DeletePostButton";
export default async function page({ params }) {
  const { userId } = await params;
  const posts = await getUserPostsFromUserId(userId);

  return (
    <main className="u-main-container u-padding-content-container">
      <h1 className="text-3xl mb-5">Dashboard - Your Articles</h1>
      <ul className="space-y-3">
        {posts.length > 0 ? (
          posts.map((post) => (
            <li
              key={post._id}
              className="group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <Link
                href={`/articles/${post.slug}`}
                className="font-semibold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors duration-200"
              >
                {post.title}
              </Link>
              <div className="flex items-center gap-x-3">
                <Link
                  href={`/dashboard/edit/${post._id}`}
                  className="min-w-16 text-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors duration-200"
                >
                  Edit
                </Link>
                <DeletePostButton id={post._id.toString()} />
              </div>
            </li>
          ))
        ) : (
          <li className="p-4 text-slate-500 bg-slate-50 rounded-lg border border-slate-200 text-center">
            You have not written any articles yet.
          </li>
        )}
      </ul>
    </main>
  );
}
