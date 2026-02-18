"use client";
import { login } from "@/lib/serverActions/session/sessionServerActions";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/app/AuthContext";

export default function page() {
  const { setIsAuthenticated } = useAuth();
  const serverInfoRef = useRef(null);
  const submitButtonRef = useRef(null);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    serverInfoRef.current.textContent = "";
    serverInfoRef.current.classList.add("hidden");
    submitButtonRef.current.textContent = "Logging in...";
    submitButtonRef.current.disabled = true;

    try {
      const result = await login(new FormData(e.target));
      if (result.success) {
        setIsAuthenticated({
          loading: false,
          isConnected: true,
          userId: result.userId,
        });
        submitButtonRef.current.textContent = "Logged In ✅";
        toast.success("You are logged in!");
        router.push("/");
      }
    } catch (error) {
      serverInfoRef.current.textContent = `${error.message}`;
      serverInfoRef.current.classList.remove("hidden");
      toast.error("Failed to log in: " + error.message);
      submitButtonRef.current.textContent = "Log In";
      submitButtonRef.current.disabled = false;
      console.log("Login error:", error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-36">
      <label htmlFor="userName" className="f_label">
        Username
      </label>
      <input
        type="text"
        className="f_auth_input"
        id="userName"
        name="userName"
        placeholder="username"
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
      <button
        ref={submitButtonRef}
        className="mt-14 w-full bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-3 px-4 my-8 rounded border-none"
      >
        Log In
      </button>
      <p ref={serverInfoRef} className="hidden text-center mb-10"></p>
    </form>
  );
}
