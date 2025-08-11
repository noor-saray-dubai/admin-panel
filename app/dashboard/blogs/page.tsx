import { BlogsPage } from "../../../components/blogs-page"
import AuthWrapper from "../../../components/auth-wrapper"
import { Suspense } from "react"

export default function Blogs() {
  return (
     <Suspense fallback={<div>Loading...</div>}>
      <BlogsPage />
    </Suspense>
  )
}
