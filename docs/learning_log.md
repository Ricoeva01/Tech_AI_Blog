# Project Architecture & Learning Log

## 1. System Architecture & Data Flow

Understanding how data moves through the application is crucial. Here is the high-level mapping:

### **Read Operation (e.g., Viewing the Homepage)**
1.  **Browser Request:** User visits `https://axoria.com/`.
2.  **Middleware (`src/middleware.js`):** The "Bouncer". It intercepts the request *before* it hits the page. It checks if the user is allowed to go there (e.g., are they logged in for `/dashboard`?). If yes, it passes the request through.
3.  **Server Component (`src/app/page.jsx`):** The page starts rendering on the server.
4.  **Server Method (`src/lib/serverMethods/`):** The page calls a function like `getAllPosts()` directly.
5.  **Database (`MongoDB`):** The method connects to the DB and fetches data.
6.  **Response:** The server sends fully rendered HTML to the browser (good for SEO).

### **Write Operation (e.g., Creating a Post)**
1.  **Client Interaction:** User fills out a form and clicks "Submit".
2.  **Server Action (`src/lib/serverActions/`):** The form data is sent to a specific function like `addPost()`. This runs strictly on the server.
3.  **Validation & Processing:** The action checks the data (is the title long enough?), processes images (upload to BunnyCDN), and sanitizes HTML.
4.  **Database Update:** The action saves the new post to MongoDB using the Mongoose Model.
5.  **Revalidation:** The action tells Next.js to purge the cache for the homepage so the new post appears immediately.
6.  **UI Update:** The user is redirected or sees a success message.

---

## 2. The `src/lib` Directory: The Engine Room

This folder contains the core logic of your application, separated by responsibility.

### **📂 `models/` (The Blueprints)**
-   **What it is:** Definitions of your data structures using Mongoose Schemas.
-   **Example (`tag.js`):** "A Tag must have a `name` (string) and a `slug` (string)."
-   **Why:** Ensures data consistency. You can't save a post without a title if the model says it's required.

### **📂 `serverActions/` (The Mutations)**
-   **What it is:** Functions that change data (Create, Update, Delete). They are triggered by **User Interactions** (forms, buttons).
-   **Key Trait:** They must have `"use server"` at the top.
-   **Example:** `addPost`, `loginUser`.

### **📂 `serverMethods/` (The Queries)**
-   **What it is:** Functions that fetch data (Read). They are used by **Server Components** to get data for rendering.
-   **Key Trait:** They are plain async functions. They do *not* need `"use server"`.
-   **Example:** `getAllPosts`, `getUserProfile`.
-   **Distinction:** We separate these from Actions to keep "Reading" logic separate from "Writing" logic, which helps with caching and organization.

### **📂 `utils/` (The Toolbox)**
-   **What it is:** Helper functions used across the app.
-   **Examples:**
    -   `db/connectDB.js`: Manages the connection to MongoDB.
    -   `errorHandling/`: Custom error classes to make debugging easier.

---

## 3. The Role of Middleware (`src/middleware.js`)

Think of the Middleware as the **Security Guard** at the entrance of a building.

-   **Location:** It sits between the user's browser and your application's pages.
-   **Job:**
    1.  **Inspect:** It looks at every request. "Where are you going?" (`pathname`), "Who are you?" (`cookies`).
    2.  **Decide:**
        -   "You're going to `/dashboard` but have no session cookie? **Redirect** to `/signin`."
        -   "You're going to `/home`? **Pass**."
-   **Why separate?** It's faster and safer to check credentials *before* the server even tries to render a potentially heavy dashboard page.

---

## 4. Professional Improvements (Next Level)

To take this project from "functioning" to "professional production-grade", consider these upgrades:

1.  **TypeScript:**
    -   **Why:** Javascript is "loose". TypeScript forces you to define exactly what a `Post` looks like. It catches bugs *while you type* (e.g., trying to access `post.titl` instead of `post.title`).

2.  **Environment Variable Validation (Zod):**
    -   **Current:** If `process.env.MONGO` is missing, the app crashes randomly when it tries to connect.
    -   **Pro:** Validate all env vars at startup. "App cannot start: MONGO_URL is missing".

3.  **Structured Logging:**
    -   **Current:** `console.log("error")`. Hard to search in production logs.
    -   **Pro:** Use a library like `pino`. `logger.error({ err, userId }, "Failed to create post")`.

4.  **Optimistic UI:**
    -   **Current:** User clicks "Like" -> Wait for server -> Update number.
    -   **Pro:** User clicks "Like" -> *Immediately* update number -> Send request in background. (If it fails, revert).

5.  **Skeleton Loading States:**
    -   **Current:** Screen might be blank while fetching.
    -   **Pro:** Show gray "placeholder" bars (`loading.jsx`) so the user knows data is coming.

---

## [2026-02-16] Optimization: Fix Homepage Performance (Over-fetching)

- **Context:** The homepage displays a list of recent articles.
- **The Problem:** The `getAllPosts` function was using `Post.find({})` without projection. This meant it was fetching the *entire* content of every blog post (including large Markdown strings) from the database, which is slow and memory-intensive.
- **The Solution:** We modified the Mongoose query to strictly select only the fields needed for the card preview: `title`, `slug`, `createdAt`, and `author`.
- **Key Concept:** **Database Projection (Select)**. Always explicitly select the fields you need when querying lists of data to minimize bandwidth and memory usage.
- **Code Snippet:**
  ```js
  // src/lib/serverMethods/blog/postMethods.js
  const posts = await Post.find({})
    .select("title slug createdAt author") // Only fetch these fields
    .populate({
      path: "author",
      select: "userName normalizedUserName",
    })
    .sort({ createdAt: -1 });
  ```

## [2026-02-16] Optimization: Improve Post Creation Speed

- **Context:** Users complained about a long wait when creating a new article, followed by an additional 3-second redirect countdown.
- **The Problem:** 
  1. **Client-side Delay:** The form submission explicitly waited 3 seconds *after* success before redirecting.
  2. **Sequential Server Operations:** The server action `addPost` was performing Image Upload (Network), Tag Processing (DB), and Markdown Processing (CPU) sequentially, one after another.
- **The Solution:**
  1. **Removed Client Delay:** Updated `src/app/dashboard/create/page.jsx` to redirect immediately upon success.
  2. **Parallel Execution:** Refactored `src/lib/serverActions/blog/postServerActions.js` to run independent tasks in parallel using `Promise.all()`.
- **Key Concept:** **Concurrency with Promise.all()**. When you have multiple async tasks that don't depend on each other (like uploading an image and checking tags in the DB), start them all at once to reduce total wait time to the duration of the slowest task.
- **Code Snippet:**
  ```js
  // src/lib/serverActions/blog/postServerActions.js
  // Run these 3 tasks at the same time
  const [publicImageURL, tagIds, markdownHTMLResult] = await Promise.all([
    imageUploadPromise, // Upload to BunnyCDN
    tagsPromise,        // Find/Create Tags in Mongo
    markdownPromise     // Parse Markdown to HTML
  ]);
  ```

## [2026-02-16] Bug Fix: Sync Dynamic APIs (Logout Error)

- **Context:** Logging out threw an error: `Error: Route "/" used cookies().get('sessionId'). cookies() should be awaited`.
- **The Problem:** In Next.js 15, dynamic APIs like `cookies()` and `headers()` became asynchronous. Accessing them synchronously (e.g., `const c = cookies()`) is now a runtime error.
- **The Solution:** Updated `logout` and `login` server actions to await the `cookies()` call.
- **Key Concept:** **Asynchronous Dynamic APIs (Next.js 15)**. Always `await` the `cookies()` function before calling `.get()` or `.set()`.
- **Code Snippet:**
  ```js
  // src/lib/serverActions/session/sessionServerActions.js
  
  // BEFORE (Error)
  // const cookieStore = cookies();
  
  // AFTER (Fixed)
  const cookieStore = await cookies(); // Must be awaited!
  cookieStore.set("sessionId", "", { ... });
  ```

## [2026-02-16] Improvement: Professional Database Connection

- **Context:** The database connection logic was basic and could create multiple connections in development (hot reload).
- **The Problem:** Mongoose connections were not cached, leading to a new connection on every API route or server action execution in dev mode.
- **The Solution:** Implemented a global caching mechanism (`global.mongoose`) in `src/lib/utils/db/connectDB.js`.
- **Key Concept:** **Global Connection Caching**. In serverless/hot-reload environments like Next.js, always cache your database connection to prevent connection exhaustion.
- **Code Snippet:**
  ```js
  // src/lib/utils/db/connectDB.js
  let cached = global.mongoose;
  if (!cached) cached = global.mongoose = { conn: null, promise: null };
  // ... reuse cached.conn if available
  ```

## [2026-02-16] Feature: Display Cover Images on Homepage

- **Context:** The homepage list of articles was missing the cover images.
- **The Solution:** 
  1. Updated `getAllPosts` query to select `coverImageURL`.
  2. Updated `src/app/page.jsx` to render the `coverImageURL` using Next.js `<Image>` component.
- **Key Concept:** **Next.js Image Component**. Use `<Image fill />` with a parent container (`relative`, `h-48`) to create responsive, optimized image cards.
- **Code Snippet:**
  ```jsx
  // src/app/page.jsx
  <div className="relative w-full h-48">
    <Image src={post.coverImageURL} fill className="object-cover" ... />
  </div>
  ```

## [2026-02-16] Optimization: Fix LCP Warning & Optimize Article Image

- **Context:** Next.js warned that the article cover image was the Largest Contentful Paint (LCP) but missing the `priority` property. Also, the image was too large visually.
- **The Problem:** 
  1. **LCP Warning (Largest Contentful Paint):** By default, Next.js "lazy loads" images (i.e., waits until they are about to scroll into view). However, the "Hero" image at the top of the article is the largest element the user sees *immediately*. Lazy loading it delays the moment the user sees the page as "complete," causing a poor LCP score and a visual "flash" of empty space.
  2. **Visual Size:** The image was rendering at full intrinsic width (1280px), appearing "too big" on many screens.
- **The Solution:**
  1. **Added `priority` prop:** We added `priority` to the `<Image>` component.
     - **What it does:** It changes the loading strategy from "Lazy" to "Eager". Next.js injects a `<link rel="preload">` tag into the HTML head.
     - **The Result:** The browser starts downloading the image *immediately* alongside the HTML, rather than waiting for JavaScript to execute. This significantly speeds up the visual rendering.
  2. **CSS Optimization:** Added `max-w-4xl` (approx 900px) to constrain the display size while keeping it responsive.
- **Deep Dive: Does Next.js Optimize & Cache?**
  - **Yes, Automatically:** Next.js uses the `sharp` library on the server to generate multiple versions of your image (resized for mobile/desktop and converted to modern formats like WebP or AVIF).
  - **Caching:** These optimized versions are cached (in `.next/cache/images` or your CDN). Subsequent users get the cached, optimized version instantly.
  - **The `priority` prop** doesn't change the *file optimization* (size/format), but it optimizes the *timing* of when the browser fetches it.
- **Code Snippet:**
  ```jsx
  // src/app/articles/[slug]/page.jsx
  <Image
    src={plainPost.coverImageURL}
    width={1280}
    height={720}
    // 'priority' tells the browser: "Download this ASAP!"
    // Fixes the LCP warning and prevents layout shift.
    priority
    className="w-full h-auto rounded-lg max-w-4xl mx-auto"
  />
  ```

## [2026-02-16] UI Fix: Consistent Blog Card Image Heights

- **Context:** The blog cards on the homepage had misalignment/gaps because the cover images had varying aspect ratios.
- **The Problem:** The \`Image\` component was set to \`w-full\` but lacked a fixed height constraint in CSS. This caused images with different aspect ratios to render at different heights, pushing the content below them unevenly.
- **The Solution:** Added the \`h-48\` (192px) utility class to the \`Image\` component in \`BlogCard.jsx\`.
  - **Tailwind Note:** \`h-48\` corresponds to \`12rem\` (48 * 0.25rem). Since 1rem is typically 16px, this results in a fixed height of \`192px\`.
- **Key Concept:** **Fixed Dimensions for Grid Items**. In a grid or flex layout where items should align, always enforce fixed dimensions (especially height) on variable content like images, using \`object-cover\` to handle the cropping gracefully.
- **Code Snippet:**
  ```jsx
  // src/components/BlogCard.jsx
  <Image
    src={post.coverImageURL}
    // ...
    className="object-cover relative w-full h-48 ..." // Added h-48
  />
  ```

## [2026-02-16] UI Improvement: Dashboard Article List Styling

- **Context:** The user dashboard displayed a raw list of articles with minimal styling.
- **The Problem:** The list was visually unappealing, lacked clear separation between items, and the action buttons (Edit/Delete) were not distinct or user-friendly.
- **The Solution:** Refactored the list to use a card-like layout for each row.
  - Added \`space-y-3\` to the parent \`ul\` for consistent vertical spacing.
  - Styled \`li\` with \`bg-white\`, \`border\`, \`rounded-lg\`, and \`shadow-sm\` to create distinct cards.
  - Enhanced typography for the article title.
  - Grouped action buttons and applied semantic colors (Indigo for primary/edit, Red for destructive/delete) with hover states for better UX.
- **Key Concept:** **List-View UI Design**. For management dashboards, use row-based cards with clear hierarchy (Title > Actions) and whitespace (\`p-4\`) to improve readability and usability compared to a dense data table or raw list.
- **Code Snippet:**
  ```jsx
  // src/app/dashboard/[userId]/page.jsx
  <li className="group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm ...">
    <Link ... className="font-semibold text-lg text-slate-800 ...">{post.title}</Link>
    <div className="flex items-center gap-x-3">
       {/* Actions */}
    </div>
  </li>
  ```

## [2026-02-16] Bug Fix: Missing Article Title in Dashboard

- **Context:** The dashboard article list showed empty spaces where the title should be.
- **The Problem:** A typo in the Mongoose projection string within \`getUserPostsFromUserId\`. The code was \`.select("title_id slug")\`, which looked for a non-existent field named "title_id" instead of selecting "title" and "_id" separately.
- **The Solution:** Corrected the typo to \`.select("title _id slug")\`.
- **Key Concept:** **Mongoose Field Selection Syntax**. When using space-separated strings in \`.select()\`, ensure spaces are present between field names. A missing space creates a single long field name that doesn't exist, resulting in \`undefined\` data without throwing an error.
- **Code Snippet:**
  ```js
  // src/lib/serverMethods/blog/postMethods.js
  // BEFORE: .select("title_id slug")
  // AFTER:
  .select("title _id slug")
  ```

## [2026-02-16] Bug Fix: Post Deletion & React Hook Violation

- **Context:** The "Delete" button in the dashboard was not working, and potentially causing runtime errors.
- **The Problem:** 
  1. **React Hook Violation:** In \`DeletePostButton.jsx\`, the \`useRouter\` hook was being called *inside* the \`onClick\` handler, which is illegal in React. Hooks must be called at the top level of the component.
  2. **Stale Data:** The server action \`deletePostById\` was only revalidating the deleted post's page, not the homepage or the dashboard list from where the deletion occurred.
- **The Solution:**
  1. **Fixed Hook Usage:** Moved \`const router = useRouter()\` to the top of the component and used the \`router\` instance inside the handler.
  2. **Added Revalidation:** Updated \`deletePostById\` to call \`revalidatePath("/")\` and \`revalidatePath(\`/dashboard/\${post.author}\`)\` to ensure the lists update immediately.
- **Key Concept:** **Rules of Hooks & Cache Revalidation**. 
  - **Hooks:** Never call hooks inside loops, conditions, or nested functions (like event handlers).
  - **Revalidation:** When deleting an item from a list, always revalidate the path(s) where that list is displayed to prevent showing stale data.
- **Code Snippet:**
  ```jsx
  // src/app/dashboard/[userId]/components/DeletePostButton.jsx
  // CORRECT:
  const router = useRouter(); // Top level
  // ... onClick={() => router.refresh()} ...
  ```

## [2026-02-16] Concept: Client Refresh vs. Server Revalidation

- **Context:** The user asked if \`revalidatePath\` is still needed if \`router.refresh()\` is already being called in the client component.
- **The Answer:** **Yes, both are necessary** for different reasons.
  - **\`revalidatePath\` (Server-Side):**
    - Tells the server to purge its **Data Cache**.
    - If you don't call this, the server might still return the old "stale" list of articles even if the client asks for new data.
    - Crucially, it updates pages *other* than the one the user is on (e.g., the Homepage).
  - **\`router.refresh()\` (Client-Side):**
    - Tells the browser to re-fetch the current route's data *right now*.
    - Without this, the user would see the deleted post until they manually refreshed the page.
- **Summary:** \`revalidatePath\` ensures the **database and cache are in sync**, while \`router.refresh()\` ensures the **user's screen is in sync** with the server.

## [2026-02-16] System Setup

- **Context:** Initializing the Gemini CLI agent for the Axoria Blog project.
- **The Problem:** The agent needs to verify it can read and write to the learning log to track progress.
- **The Solution:** Added a test entry to the learning log.
- **Key Concept:** **Tool Validation**. Verifying tool access (read/write) at the start of a session ensures smooth collaboration.
- **Code Snippet:**
  ```bash
  # System check complete
  ```

## [2026-02-16] Feature: Tag Aggregation and Counting

- **Context:** We need to fetch tags to display them, but we only want tags that are actually used in posts, and we want to know how many posts use each tag.
- **The Problem:** A simple `Tag.find()` would return all tags, including unused ones, and wouldn't tell us how many posts use each tag without N+1 queries.
- **The Solution:** We used `Tag.aggregate()` to join tags with posts, count the matches, filter out unused tags, and sort by popularity.
- **Key Concept:** **MongoDB Aggregation Pipeline**. `aggregate` is a powerful MongoDB framework (exposed via Mongoose) that processes data through a series of stages (like `$lookup`, `$match`, `$group`, `$project`) to transform documents. It allows complex analytics to happen on the database server rather than in the application code.
- **Code Snippet:**
  ```js
  // src/lib/serverMethods/blog/tagMethods.js
  const tags = await Tag.aggregate([
    {
      $lookup: { // Join with 'posts' collection
        from: "posts",
        localField: "_id",
        foreignField: "tags",
        as: "postsWithTag",
      },
    },
    {
      $addFields: { // Calculate count
        postCount: { $size: "$postsWithTag" },
      },
    },
    // ... filter and sort
  ]);
  ```

## [2026-02-16] Bug Fix: Undefined Aggregate Method (Import Mismatch)

- **Context:** The application crashed with `Error: Cannot read properties of undefined (reading 'aggregate')` when accessing the categories page.
- **The Problem:** `tagMethods.js` was using a **default import** (`import Tag from ...`) but the `Tag` model was exported as a **named export** (`export const Tag = ...`) in `models/tag.js`. This made `Tag` undefined in the method file.
- **The Solution:** Changed the import to a named import (`import { Tag } from ...`).
- **Key Concept:** **ES6 Module Imports**. Always check how a module is exported (`export default` vs `export const`). Mismatched imports result in `undefined` values that cause runtime crashes.
- **Code Snippet:**
  ```js
  // src/lib/serverMethods/blog/tagMethods.js
  
  // WRONG (Default Import):
  // import Tag from "@/lib/models/tag"; 
  
  // CORRECT (Named Import):
  import { Tag } from "@/lib/models/tag";
  ```

## [2026-02-16] Bug Fix: Broken Author Link on Tag Page

- **Context:** Users reported a "Page Not Found" error when clicking the author name on a blog card from the Tag page (`/categories/tag/[tag]`).
- **The Problem:** The `BlogCard` component constructs the author link using `post.author.normalizedUserName`. However, the `getPostsByTag` method in `src/lib/serverMethods/blog/postMethods.js` was only selecting the `userName` field when populating the author, leaving `normalizedUserName` as `undefined`.
- **The Solution:** Updated `getPostsByTag` to explicitly select both `userName` and `normalizedUserName`.
- **Key Concept:** **Data Consistency in Shared Components**. When a component (`BlogCard`) is reused across different pages, ensure that all data fetching methods (`getPostsByTag`, `getAllPosts`, etc.) provide the exact same data structure expected by that component.
- **Code Snippet:**
  ```js
  // src/lib/serverMethods/blog/postMethods.js
  // BEFORE: .populate({ path: "author", select: "userName" })
  // AFTER:
  .populate({ path: "author", select: "userName normalizedUserName" })
  ```

## [2026-02-16] Bug Fix: Broken Edit Link in Dashboard

- **Context:** Clicking "Edit" on an article in the user dashboard resulted in a 404 "Page Not Found" error.
- **The Problem:** The edit link in `src/app/dashboard/[userId]/page.jsx` was constructed as `/dashboard/${userId}/edit/${post.slug}`, incorrectly including the `userId` in the path. However, the file structure showed that the edit page is located at `src/app/dashboard/edit/[slug]`, meaning the correct route is simply `/dashboard/edit/${post.slug}`. The `edit` folder is a sibling of the `[userId]` folder, not a child.
- **The Solution:** Updated the `Link` component `href` to point to `/dashboard/edit/${post.slug}`.
- **Key Concept:** **Next.js File-System Routing**. The directory structure directly maps to the URL paths. If a folder is a sibling (same level), its route is not nested under the other folder's route parameter. Always verify the file tree against the constructed URL.
- **Code Snippet:**
  ```jsx
  // src/app/dashboard/[userId]/page.jsx
  // BEFORE: href={`/dashboard/${userId}/edit/${post.slug}`}
  // AFTER:
  href={`/dashboard/edit/${post.slug}`}
  ```

## [2026-02-16] Bug Fix: Pass Server Data to Client Component (Await Promise)

- **Context:** The edit post form (`ClientEditForm`) was receiving empty/undefined data even though `defaultValue={post.title}` was set.
- **The Problem:** In the server page (`page.jsx`), the async function `getPostForEditPost(slug)` was called **without** `await`. This meant the `post` variable held a `Promise`, not the actual data object. When `JSON.stringify` runs on a pending Promise, it results in an empty object, causing the client component to receive no data.
- **The Solution:** Added `await` before the function call: `const post = await getPostForEditPost(slug);`.
- **Key Concept:** **Async/Await in Server Components**. Always `await` your data fetching functions in Server Components before passing the result to Client Components. Passing a Promise directly usually results in serialization issues.
- **Code Snippet:**
  ```javascript
  // src/app/dashboard/edit/[slug]/page.jsx
  // BEFORE: const post = getPostForEditPost(slug);
  // AFTER:
  const post = await getPostForEditPost(slug);
  ```

## [2026-02-16] Feature: Pre-populate Edit Form

- **Context:** The edit form had the title pre-filled, but the article body (markdown) and tags were empty.
- **The Solution:**
  1.  Added `defaultValue={post.markdownArticle}` to the `<textarea>`.
  2.  Initialized the `tags` state with existing tags: `useState(post?.tags?.map(t => t.name) || [])`.
- **Key Concept:** **Controlled vs Uncontrolled Inputs**. For "Edit" forms, use `defaultValue` for uncontrolled inputs (like native `input` or `textarea`) to show initial server data while allowing user edits. For state-driven inputs (like our tag list), initialize the state with the server data.
- **Code Snippet:**
  ```javascript
  // src/app/dashboard/edit/[slug]/components/ClientEditForm.jsx
  <textarea defaultValue={post.markdownArticle} ... />
  ```

## [2026-02-16] Bug Fix: Crash on Post Edit (Missing Import)

- **Context:** Submitting an edited post caused the server to crash with `Failed to update and save post`.
- **The Problem:** 
  1. **Missing Import:** The function `findOrCreate` in `tagMethods.js` used the `slugify` library but failed to import it, causing a `ReferenceError` when processing tags.
  2. **Logic Error:** The `areTagSimilar` utility function incorrectly compared array of strings (user input) with array of tag objects (database), always returning `false` and triggering unnecessary tag updates (which then crashed due to problem #1).
- **The Solution:**
  1. Added `import slugify from "slugify"` to `src/lib/serverMethods/tag/tagMethods.js`.
  2. Updated `areTagSimilar` in `src/lib/utils/general/utils.js` to normalize inputs (extracting `.name` from objects) before comparing.
- **Key Concept:** **Defensive Programming & Type Safety**. Always verify external library imports. When comparing complex data structures (like arrays of objects vs arrays of strings), ensure you are comparing compatible types (e.g., normalize everything to strings first).
- **Code Snippet:**
  ```javascript
  // src/lib/serverMethods/tag/tagMethods.js
  import slugify from "slugify"; // Added missing import
  
  // src/lib/utils/general/utils.js
  const normalize = (tag) => (typeof tag === "object" && tag.name ? tag.name : tag);
  // ... map(normalize).sort() ...
  ```

## [2026-02-16] Bug Fix: Image Upload Check (HTTP Response)

- **Context:** Uploading a new image during post editing was not working or throwing confusing errors.
- **The Problem:** 
  1. **Incorrect Conditional:** The code checked `if (!response)` to determine failure. However, `fetch` always returns a `Response` object even on HTTP errors (like 401 or 500). The correct check is `if (!response.ok)`.
  2. **Blocking Deletion:** The action also tried to delete the old image before uploading the new one. If the old image was already missing (404), the `DELETE` request failed, causing the entire update to throw an error and abort, preventing the user from setting a new image.
- **The Solution:**
  1. Updated the upload check to `if (!imageToUploadResponse.ok)`.
  2. Downgraded the image deletion error from `throw` to `console.warn`, allowing the process to continue even if deleting the old file fails.
- **Key Concept:** **Handling HTTP Errors**. Always use `response.ok` (boolean) to check for success (status in the range 200-299). Also, consider which failures should be blocking (upload failing) vs. non-blocking (cleanup failing).
- **Code Snippet:**
  ```javascript
  // src/lib/serverActions/blog/postServerActions.js
  
  // BEFORE (Buggy):
  // if (!imageToUploadResponse) throw new AppError(...);
  
  // AFTER (Correct):
  if (!imageToUploadResponse.ok) throw new AppError(...);
  
  // Non-blocking cleanup:
  if (!imageDeletionReponse.ok) console.warn("Failed to delete...");
  ```

## [2026-02-16] Concept: Middleware Redirects & Edge Compatibility

- **Context:** Middleware threw a TypeError when trying to redirect unauthorized users: `NextResponse.redirect("/signin")`.
- **The Problem:** Next.js Middleware runs on the **Edge Runtime**, not Node.js. In this environment, relative URL strings (like `"/signin"`) are invalid for redirects because the server doesn't "know" the current domain context implicitly.
- **The Solution:** Always use `new URL()` to construct an absolute URL: `NextResponse.redirect(new URL("/signin", request.url))`.
- **Architecture Note:**
  - **Middleware (Edge):** Handles the request first. Since it cannot access MongoDB directly (no Node.js drivers), it makes an HTTP `fetch` call to a standard API route.
  - **API Route (Node.js):** `/api/auth/validateSession` receives the call, connects to MongoDB, and validates the session cookie.
  - **Why?** This separation allows database-backed sessions to be verified securely while still utilizing Next.js Middleware for route protection.
- **Code Snippet:**
  ```javascript
  // src/middleware.js
  // WRONG: return NextResponse.redirect("/signin");
  
  // CORRECT:
  return NextResponse.redirect(new URL("/signin", request.url));
  ```

## [2026-02-18] Bug Fix: Loading State Not Visible

- **Context:** User reported that `loading.jsx` was not working.
- **The Problem:** 
  1. **Typo:** The class name was `aboslute` instead of `absolute`.
  2. **Performance:** The data fetch was too fast to trigger a visible loading state.
- **The Solution:**
  1. Fixed the typo in `src/app/loading.jsx`.
  2. Added a temporary 2-second delay in `src/app/page.jsx` to verify the loading spinner works.
- **Key Concept:** `loading.jsx` is only visible while the page content is suspended (fetching data). If the server responds instantly, the loading state is skipped or flashes too fast to see.
- **Code Snippet:**
  ```jsx
  // src/app/loading.jsx
  // BEFORE: className="aboslute ..."
  // AFTER:  className="absolute ..."
  ```

## [2026-02-18] Bug Fix: Crash on 404 (Missing Null Check)

- **Context:** Accessing a non-existent article URL caused a server crash: `TypeError: Cannot read properties of null (reading 'title')`.
- **The Problem:** The `getPost` method returned `null` when an article wasn't found, but the page component immediately tried to access properties like `post.title` without checking if `post` existed.
- **The Solution:** Imported `notFound` from `next/navigation` and added a check: `if (!post) notFound();`.
- **Key Concept:** **Handling Null/Undefined Data**. Always validate data returned from database queries before trying to access its properties. In Next.js App Router, use the `notFound()` helper to render the `not-found.jsx` UI.
- **Code Snippet:**
  ```javascript
  // src/app/articles/[slug]/page.jsx
  const post = await getPost(slug);
  if (!post) notFound(); // Stop execution and show 404 page
  // ... safe to access post.title
  ```

## [2026-02-18] Bug Fix: 404 Client Exception & Parallel Route Error

- **Context:** Navigating to a 404 page and then back to the homepage caused a client-side exception: *"Rendered more hooks than during the previous render"* and *"No default component was found for a parallel route"*.
- **The Problem:** 
  1. **Parallel Route Error:** Next.js uses "slots" for routing. When `loading.jsx` is present, it creates an implicit slot. If a page (like 404) is rendered and then you navigate away, Next.js might not know what to render in that slot if a `default.js` is missing.
  2. **Hooks Mismatch:** The global `loading.jsx` wraps the page content in a `<Suspense>` boundary. The `not-found.jsx` might render differently in the tree. Transitioning between them caused React's virtual DOM to get out of sync regarding hook counts.
- **The Solution:**
  1. **Removed Global Loading:** Deleted `src/app/loading.jsx` to prevent the implicit Suspense boundary at the root level from conflicting with the 404 page.
  2. **Added Default Component:** Created `src/app/default.js` returning `null`. This explicitly tells Next.js to render "nothing" for unmatched parallel routes instead of crashing.
- **Key Concept:** **Parallel Routes & Default.js**. When using `not-found.jsx` or complex routing, always provide a `default.js` file. It acts as a fallback for parallel slots (like `@children` or `@modal`) when the URL doesn't match a specific page for that slot.
- **Code Snippet:**
  ```javascript
  // src/app/default.js
  export default function Default() {
    return null;
  }
  ```

## [2026-02-18] Operation: App Renaming & Deployment

- **Context:** Finalizing the application for public release on GitHub and Vercel.
- **The Tasks:**
  1. **Renaming:** Changed the app name from "Axoria" to "TechIABlog" in `package.json` and the metadata in `src/app/layout.jsx`.
  2. **Git Push:** Instructions provided for initializing and pushing to a remote repository.
  3. **Vercel Deployment:** Detailed steps for importing the project and configuring environment variables.
- **Key Concept:** **Production Readiness**. Before deployment, ensure branding is consistent (app name, metadata) and sensitive configuration (env vars) is securely transferred to the hosting provider, never committed to code.
- **Deployment Instructions:**
  
  **Git Commands:**
  ```bash
  git add .
  git commit -m "Rename app to TechIABlog"
  git branch -M main
  git remote add origin <YOUR_REPO_URL>
  git push -u origin main
  ```

  **Vercel Setup:**
  1. Import project from GitHub.
  2. Add the following Environment Variables (from `.env.local`):
     - `MONGO`
     - `BUNNY_STORAGE_ZONE`
     - `BUNNY_STORAGE_HOST`
     - `BUNNY_STORAGE_API_KEY`
  3. Click Deploy.
