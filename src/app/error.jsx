"use client";
import Link from "next/link";

export default function error() {
  return (
    <div className="u-main-container pt-44 text-center">
      <h1 className="text-4xl font-bold mb-4 text-red-500">
        A server error has occured
      </h1>
      <Link href="/">Return to Homepage</Link>
    </div>
  );
}
