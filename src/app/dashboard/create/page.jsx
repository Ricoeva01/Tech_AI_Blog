"use client";
import { addPost } from "@/lib/serverActions/blog/postServerActions";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function page() {
  const [tags, setTags] = useState([]);
  const router = useRouter();
  const tagInputRef = useRef(null);
  const submitButtonRef = useRef(null);
  const serverValidationText = useRef(null);
  const imgUploadValidationText = useRef(null);
  // Function to handle form submission

  async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.set("tags", JSON.stringify(tags)); // Add tags to formData as a JSON string
    serverValidationText.current.textContent = "";
    submitButtonRef.current.textContent = "Saving Post..";
    submitButtonRef.current.disabled = true;
    try {
      const result = await addPost(formData);
      if (result.success) {
        toast.success("Post added successfully!");
        submitButtonRef.current.textContent = `Post Saved ✅ `;
        e.target.reset();
        setTags([]);
        router.push(`/articles/${result.slug}`);
      }
    } catch (error) {
      toast.error("Failed to add post: " + error.message);
      serverValidationText.current.textContent = `${error.message}`;
      submitButtonRef.current.textContent = "Submit";
      submitButtonRef.current.disabled = false;
    }
  }
  // Function to handle adding a tag
  function handleAddTag() {
    const newTag = tagInputRef.current.value.trim().toLowerCase();
    if (newTag && !tags.includes(newTag) && tags.length < 5) {
      setTags([...tags, newTag]);
      tagInputRef.current.value = "";
    }
  }
  function handleEnterOnTagInput(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  }
  // Function to remove a tag
  function handleRemoveTag(tagToRemove) {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    const validImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (file && !validImageTypes.includes(file.type)) {
      toast.error(
        "Invalid file type. Please upload a JPEG, PNG, or GIF image.",
      );
      imgUploadValidationText.current.textContent =
        "Invalid file type. Please upload a JPEG, PNG, or GIF image.";
      e.target.value = "";
      return;
    } else {
      imgUploadValidationText.current.textContent = "";
    }
    const img = new Image();
    img.addEventListener("load", checkImgSizedOnLoad);
    function checkImgSizedOnLoad() {
      if (img.width > 1280 || img.height > 720) {
        toast.error(
          "Image dimensions are too large. Maximum size is 1280x720 pixels.",
        );
        imgUploadValidationText.current.textContent =
          "Image dimensions are too large. Maximum size is 1280x720 pixels.";
        e.target.value = "";
        URL.revokeObjectURL(img.src);
        img.src = "";
        return;
      } else {
        imgUploadValidationText.current.textContent = "";
        URL.revokeObjectURL(img.src);
      }
    }
    img.src = URL.createObjectURL(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imagePreview = document.getElementById("imagePreview");
        if (imagePreview) {
          imagePreview.src = event.target.result;
        } // Clear the file input
      };
    }
  }
  return (
    <main className="u-main-container bg-white p-7 mt-32 mb-44">
      <h1>ADD ARTICLE 📇 </h1>
      <form onSubmit={handleSubmit} className="pb-6">
        <label htmlFor="title" className="f_label">
          Title
        </label>
        <input
          type="text"
          name="title"
          className="shadow border rounded w-full p-3 mb-7 text-gray-700 focus:outline-slate-400"
          id="title"
          placeholder="Title"
          required
        />
        <label htmlFor="coverImage" className="f_label">
          Cover Image (1280x720px maximum size)
        </label>
        <input
          type="file"
          name="coverImage"
          className="shadow cursor-pointer border rounded w-full p-3 mb-2 text-gray-700 focus:outline-none focus:shadow-outline"
          id="coverImage"
          required
          placeholder="Article Cover Image"
          onChange={handleFileChange}
        />
        <p
          className="text-sm text-red-700 mb-7"
          ref={imgUploadValidationText}
        ></p>
        <div className="mb-10">
          <label htmlFor="tag" className="f_label">
            Tags (optional, max 5 tags)
          </label>
          <div className="flex">
            <input
              type="text"
              id="tag"
              name="tag"
              ref={tagInputRef}
              onKeyDown={handleEnterOnTagInput}
              className="shadow border rounded p-3 text-gray-700 focus:outline-slate-400"
              placeholder="Add tags"
            />
            <button
              className="bg-indigo-500 text-white font-bold p-4 rounded mx-4 hover:bg-indigo-700"
              onClick={handleAddTag}
              type="button"
            >
              Add
            </button>
            <div className="flex items-center grow whitespace-nowrap overflow-y-auto shadow border rounded px-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block whitespace-nowrap bg-gray-200 text-gray-700 px-3 py-1 rounded-full gap-2 text-sm mr-2 font-semibold"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-red-500 hover:text-red-700 ml-1"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <label htmlFor="markdownArticle" className="f_label">
          Write your article using markdown do not repeat the given title
        </label>
        <a href="#" target="blank" className="block mb-4 text-blue-600">
          Markdown Tricks
        </a>
        <textarea
          name="markdownArticle"
          id="markdownArticle"
          required
          className="min-h-44 text-xl shadow appearance-none border rounded w-full p-8 text-gray-700 mb-4 focus:outline-slate-400"
        ></textarea>
        <button
          ref={submitButtonRef}
          className="min-w-44 bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded border-none mb-4"
        >
          Submit
        </button>
        <p ref={serverValidationText}></p>
      </form>
    </main>
  );
}
