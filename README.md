# TechIABlog 🤖

A modern, full-stack tech blog built with **Next.js 15**, **MongoDB**, and **Tailwind CSS**. 
Features include markdown-based article creation, user authentication, image optimization, and a responsive design.

## 🚀 Key Features

- **Next.js App Router:** Server Components for SEO and performance, Client Components for interactivity.
- **Full-Stack:** Integrated API routes and Server Actions for backend logic.
- **Database:** MongoDB with Mongoose for structured data modeling (Users, Posts, Tags).
- **Authentication:** Custom session-based authentication using HTTP-only cookies.
- **Content Management:** Markdown support with syntax highlighting for code blocks.
- **Image Handling:** Integration with BunnyCDN for optimized image delivery.
- **Styling:** Tailwind CSS for rapid, responsive UI development.

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/)
- **Language:** JavaScript
- **Database:** MongoDB
- **ORM:** Mongoose
- **Styling:** Tailwind CSS
- **Authentication:** Custom (JWT/Session Cookies)
- **Markdown:** `marked`, `marked-highlight`, `prismjs`
- **Utilities:** `date-fns`, `sonner` (toasts), `zod` (validation)

## 📦 Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/TechIABlog.git
    cd TechIABlog
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root directory and add the following variables:
    ```env
    MONGO=your_mongodb_connection_string
    BUNNY_STORAGE_ZONE=your_bunny_zone
    BUNNY_STORAGE_HOST=your_bunny_host
    BUNNY_STORAGE_API_KEY=your_bunny_key
    # Add other necessary secrets here
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🚢 Deployment (Vercel)

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

1.  Push your code to a GitHub repository.
2.  Import the project into Vercel.
3.  Add your **Environment Variables** (from `.env.local`) in the Vercel project settings.
4.  Deploy!

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)