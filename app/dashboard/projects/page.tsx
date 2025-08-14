import { ProjectsPage } from "@/components/projects-page";
import { Suspense } from "react";



export default function Projects() {
  return (
   <Suspense fallback={<div>Loading...</div>}> 
      <ProjectsPage />
    </Suspense>
    
  )
}
