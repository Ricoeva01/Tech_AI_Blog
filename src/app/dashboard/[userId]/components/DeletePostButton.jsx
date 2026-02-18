"use client";
import { deletePostById } from "@/lib/serverActions/blog/postServerActions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function DeletePostButton({ id }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="min-w-16 text-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 transition-colors duration-200"
      onClick={async () => {
        try {
          const result = await deletePostById(id);
          if (result.success) {
            toast.success("Post deleted successfully.");
            router.refresh(); // Refresh the page to reflect the deletion
          } else {
            toast.error("Failed to delete post.");
          }
        } catch (err) {
          toast.error(err.message || "Failed to delete post.");
        }
      }}
    >
      Delete
    </button>
  );
}
