import Link from "next/link";

export default function NotFound() {
  return (
    <div className="pt-44 text-center">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <Link className="text-blue-600" href="/">
        Return to Homepage
      </Link>
    </div>
  );
}
