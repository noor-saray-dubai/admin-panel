// "use client"

// import { useState } from "react"
// import { LuxurySidebar } from "./components/luxury-sidebar"
// import { LuxuryHeader } from "./components/luxury-header"
// import { LuxuryDashboard } from "./components/luxury-dashboard"
// import { ProjectsPage } from "./components/projects-page"
// import { DevelopersPage } from "./components/developers-page"
// import { BlogsPage } from "./components/blogs-page"
// import { LuxurySignIn } from "./components/luxury-signin"

// export default function AdminPanel() {
//   const [currentPage, setCurrentPage] = useState("dashboard")
//   const [isAuthenticated, setIsAuthenticated] = useState(false)

//   // Add modal states
//   const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
//   const [isBlogModalOpen, setIsBlogModalOpen] = useState(false)
//   const [isDeveloperModalOpen, setIsDeveloperModalOpen] = useState(false)

//   const handleNavigation = (page: string) => {
//     setCurrentPage(page)
//   }

//   const handleSignIn = () => {
//     setIsAuthenticated(true)
//   }

//   const handleSignOut = () => {
//     setIsAuthenticated(false)
//     setCurrentPage("dashboard")
//   }

//   // Add modal handlers
//   const handleOpenProjectModal = () => {
//     setCurrentPage("projects")
//     // Small delay to ensure page loads first
//     setTimeout(() => {
//       setIsProjectModalOpen(true)
//     }, 100)
//   }

//   const handleOpenBlogModal = () => {
//     setCurrentPage("blogs")
//     setTimeout(() => {
//       setIsBlogModalOpen(true)
//     }, 100)
//   }

//   const handleOpenDeveloperModal = () => {
//     setCurrentPage("developers")
//     setTimeout(() => {
//       setIsDeveloperModalOpen(true)
//     }, 100)
//   }

//   if (!isAuthenticated) {
//     return <LuxurySignIn onSignIn={handleSignIn} />
//   }

//   const renderContent = () => {
//     switch (currentPage) {
//       case "projects":
//         return <ProjectsPage initialModalOpen={isProjectModalOpen} onModalClose={() => setIsProjectModalOpen(false)} />
//       case "developers":
//         return (
//           <DevelopersPage initialModalOpen={isDeveloperModalOpen} onModalClose={() => setIsDeveloperModalOpen(false)} />
//         )
//       case "blogs":
//         return <BlogsPage initialModalOpen={isBlogModalOpen} onModalClose={() => setIsBlogModalOpen(false)} />
//       case "communities":
//         return (
//           <div className="space-y-6">
//             <div>
//               <h1 className="text-3xl font-semibold text-gray-900">Communities</h1>
//               <p className="text-gray-600">Manage communities and neighborhoods</p>
//             </div>
//             <div className="text-center py-16 text-gray-500">
//               <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <span className="text-2xl">🏘️</span>
//               </div>
//               <p className="text-lg font-medium text-gray-900">Communities</p>
//               <p className="text-sm text-gray-600">Coming soon</p>
//             </div>
//           </div>
//         )
//       case "settings":
//         return (
//           <div className="space-y-6">
//             <div>
//               <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
//               <p className="text-gray-600">System configuration and preferences</p>
//             </div>
//             <div className="text-center py-16 text-gray-500">
//               <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <span className="text-2xl">⚙️</span>
//               </div>
//               <p className="text-lg font-medium text-gray-900">Settings</p>
//               <p className="text-sm text-gray-600">Coming soon</p>
//             </div>
//           </div>
//         )
//       default:
//         return (
//           <LuxuryDashboard
//             onNavigate={handleNavigation}
//             onOpenProjectModal={handleOpenProjectModal}
//             onOpenBlogModal={handleOpenBlogModal}
//             onOpenDeveloperModal={handleOpenDeveloperModal}
//           />
//         )
//     }
//   }

//   return (
//     <div className="flex h-screen bg-gray-50">
//       {/* Luxury Sidebar */}
//       <div className="w-64 flex-shrink-0">
//         <LuxurySidebar currentPage={currentPage} onNavigate={handleNavigation} />
//       </div>

//       {/* Main Content Area */}
//       <div className="flex-1 flex flex-col min-w-0">
//         <LuxuryHeader onSignOut={handleSignOut} />
//         <main className="flex-1 overflow-y-auto p-8">{renderContent()}</main>
//       </div>
//     </div>
//   )
// }
