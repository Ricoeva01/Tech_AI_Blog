"use client";
import { useAuth } from "@/app/AuthContext";
import NavBarDropdown from "@/components/NavBarDropdown";
import Image from "next/image";
import Link from "next/link";

function Navbar() {
  const { isAuthenticated } = useAuth();
  return (
    <nav className="fixed z-10 w-full bg-slate-50 border-b border-b-zinc-300">
      <div className="u-main-container flex py-4">
        <Link href="/" className="mr-2 text-zinc-900 ">
          Tech IA Blog 🤖
        </Link>
        <Link href="/categories" className="mx-2 text-zinc-900 mr-auto">
          Categories
        </Link>
        {isAuthenticated.loading && (
          <div>
            <Image
              src="/icons/loader.svg"
              alt="loading"
              width={24}
              height={24}
            ></Image>
          </div>
        )}
        {isAuthenticated.isConnected && (
          <>
            <Link href="/dashboard/create" className="mx-2 text-zinc-900">
              {" "}
              + 📇 Article
            </Link>
            <NavBarDropdown userId={isAuthenticated.userId} />
          </>
        )}
        {!isAuthenticated.isConnected && !isAuthenticated.loading && (
          <>
            <Link href="/signin" className="mx-2 text-zinc-900">
              {" "}
              Log In
            </Link>
            <Link href="/signup" className="mx-2 text-zinc-900">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
export default Navbar;
