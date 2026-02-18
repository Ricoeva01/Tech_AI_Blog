import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner";
import { AuthProvider } from "./AuthContext";
import "./globals.css";

export const metadata = {
  title: "TechIABlog",
  description: "Tech news for everyday",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      <body className="flex min-h-full flex-col">
        <AuthProvider>
          <Navbar />
          <main className="grow relative">{children}</main>
        </AuthProvider>
        <Footer />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
