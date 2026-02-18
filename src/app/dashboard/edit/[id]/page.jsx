import { getPostForEditPost } from "@/lib/serverMethods/blog/postMethods";
import { Types } from "mongoose";
import ClientEditForm from "./components/ClientEditForm";

export default async function page({ params }) {
  const { id } = await params;
  const post = await getPostForEditPost(id);
  //when we want to pass server data to client server, data need to be serialized
  const serializablePost = JSON.parse(
    JSON.stringify(post, (key, value) =>
      value instanceof Types.ObjectId ? value.toString() : value,
    ),
  );

  return <ClientEditForm post={serializablePost} />;
}
