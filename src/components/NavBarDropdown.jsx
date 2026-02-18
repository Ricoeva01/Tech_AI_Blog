"use client";
import { useAuth } from "@/app/AuthContext";
import { logout } from "@/lib/serverActions/session/sessionServerActions";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function NavBarDropdown({ userId }) {
  const { setIsAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef();
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeDropdown();
      }
    }
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);
  function closeDropdown() {
    setIsOpen(false);
  }

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }
  async function handleLogout() {
    const result = await logout();
    if (result.success) {
      setIsAuthenticated({
        loading: false,
        isConnected: false,
        userId: null,
      });
      router.push("/");
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button className="flex" onClick={toggleDropdown}>
        <Image
          src="/icons/user.svg"
          alt="iconImage"
          width={24}
          height={24}
          className="fill-indigo-500"
        />
      </button>
      {isOpen && (
        <ul className="absolute right-0 top-10 w-[250px] border-b border-x border-zinc-300">
          <li className="bg-slate-50 hover:bg-slate-200">
            <Link
              href={`/dashboard/${userId}`}
              className="block p-4"
              onClick={closeDropdown}
            >
              Dashboard
            </Link>
          </li>
          <li className="bg-slate-50 hover:bg-slate-200">
            <button onClick={handleLogout} className="w-full p-4 text-left">
              Log-Out
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
