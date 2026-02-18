"use client";
import { register } from "@/lib/serverActions/session/sessionServerActions";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { toast } from "sonner";

export default function page() {
  const serverInfoRef = useRef(null);
  const submitButtonRef = useRef(null);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    serverInfoRef.current.textContent = "";
    serverInfoRef.current.classList.add("hidden");
    submitButtonRef.current.textContent = "Saving user...";
    submitButtonRef.current.disabled = true;

    try {
      const result = await register(new FormData(e.target));
      if (result.success) {
        submitButtonRef.current.textContent = `User Created ✅ `;
        let countdown = 3;
        serverInfoRef.current.classList.remove("hidden");
        serverInfoRef.current.textContent = `Redirecting in ${countdown}...`;
        const interval = setInterval(() => {
          countdown -= 1;
          serverInfoRef.current.textContent = `Redirecting in ${countdown}...`;
          if (countdown === 0) {
            toast.success("User created successfully!");
            clearInterval(interval);
            e.target.reset();
            router.push(`/signin`);
          }
        }, 1000);
      }
    } catch (error) {
      toast.error("Failed to add post: " + error.message);
      serverInfoRef.current.classList.remove("hidden");
      serverInfoRef.current.textContent = `${error.message}`;
      submitButtonRef.current.textContent = "Submit";
      submitButtonRef.current.disabled = false;
    }
  }
  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-36">
      <label htmlFor="userName" className="f_label">
        Name or pseudo
      </label>
      <input
        type="text"
        className="f_auth_input"
        id="userName"
        name="userName"
        placeholder="Name or pseudo"
        required
      />
      <label htmlFor="email" className="f_label">
        Email
      </label>
      <input
        type="email"
        className="f_auth_input"
        id="email"
        name="email"
        placeholder="E-mail"
        required
      />
      <label htmlFor="password" className="f_label">
        Password
      </label>
      <input
        type="password"
        className="f_auth_input"
        id="password"
        name="password"
        placeholder="Password"
        required
      />
      <label htmlFor="passwordRepeat" className="f_label">
        Confirm Password
      </label>
      <input
        type="password"
        className="f_auth_input"
        id="passwordRepeat"
        name="passwordRepeat"
        placeholder="Confirm Password"
        required
      />
      <button
        ref={submitButtonRef}
        className="mt-14 w-full bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-3 px-4 my-10 rounded border-none"
      >
        Sign-Up
      </button>
      <p ref={serverInfoRef} className="hidden text-center mb-10"></p>
      <a
        href="/signin"
        className="mb-5 underline text-blue-600 block text-center"
      >
        Already have an account? Log-In
      </a>
    </form>
  );
}
