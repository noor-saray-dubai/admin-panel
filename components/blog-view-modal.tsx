import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, User, Clock, Eye, Star, Hash } from "lucide-react"
import { JSX } from "react"

// Types matching your schema
interface ITextFormatting {
  bold: boolean
  italic: boolean
  color: string
}

interface ITextSegment extends ITextFormatting {
  type: "text"
  content: string
}

interface ILinkSegment extends ITextFormatting {
  type: "link"
  content: string
  url: string
}

type IContentSegment = ITextSegment | ILinkSegment

interface IListItem {
  text: string
  subItems?: string[]
}

interface IParagraphBlock {
  type: "paragraph"
  order: number
  content: IContentSegment[]
}

interface IHeadingBlock extends ITextFormatting {
  type: "heading"
  order: number
  level: 1 | 2 | 3 | 4 | 5 | 6
  content: string
}

interface IImageBlock {
  type: "image"
  order: number
  url: string
  alt: string
  caption?: string
  file?: File
}

interface ILinkBlock extends ITextFormatting {
  type: "link"
  order: number
  url: string
  coverText: string
}

interface IQuoteBlock {
  type: "quote"
  order: number
  content: IContentSegment[]
  author?: string
  source?: string
}

interface IListBlock extends ITextFormatting {
  type: "list"
  order: number
  listType: "ordered" | "unordered"
  title: string
  items: IListItem[]
}

type IContentBlock = IParagraphBlock | IHeadingBlock | IImageBlock | ILinkBlock | IQuoteBlock | IListBlock

interface IAuditInfo {
  email: string
  timestamp: Date | string
  ipAddress?: string
  userAgent?: string
}

interface Blog {
  _id?: string
  title: string
  slug?: string
  excerpt: string
  contentBlocks: IContentBlock[]
  featuredImage?: string
  author: string
  category: string
  tags: string[]
  status: "Published" | "Draft" | "Scheduled"
  publishDate: string | Date
  readTime: number
  views: number
  featured: boolean
  createdBy: IAuditInfo
  updatedBy: IAuditInfo
  version: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

interface BlogViewModalProps {
  isOpen: boolean
  onClose: () => void
  blog: Blog | null
  onEdit?: () => void
  onDelete?: () => void
}

// Component to render individual content segments
// function ContentSegmentRenderer({ segment }: { segment: IContentSegment }) {
//   const style = {
//     fontWeight: segment.bold ? 'bold' : 'normal',
//     fontStyle: segment.italic ? 'italic' : 'normal',
//     color: segment.color || '#000000'
//   }

//   if (segment.type === "link") {
//     return (
//       <a 
//         href={segment.url} 
//         target="_blank" 
//         rel="noopener noreferrer"
//         style={style}
//         className="hover:underline"
//       >
//         {segment.content}
//       </a>
//     )
//   }

//   return <span style={style}>{segment.content}</span>
// }

// Component to render content blocks
function ContentBlockRenderer({ block }: { block: IContentBlock }) {
  const getHeadingStyle = (block: IHeadingBlock) => ({
    fontWeight: block.bold ? 'bold' : 'normal',
    fontStyle: block.italic ? 'italic' : 'normal',
    color: block.color || '#000000'
  })

  const getTextStyle = (block: ITextFormatting) => ({
    fontWeight: block.bold ? 'bold' : 'normal',
    fontStyle: block.italic ? 'italic' : 'normal',
    color: block.color || '#000000'
  })

  switch (block.type) {
    case "heading":
      const HeadingTag = `h${block.level}` as keyof JSX.IntrinsicElements
      const headingClasses = {
        1: "text-4xl font-bold mb-6",
        2: "text-3xl font-semibold mb-5",
        3: "text-2xl font-semibold mb-4",
        4: "text-xl font-semibold mb-3",
        5: "text-lg font-semibold mb-3",
        6: "text-base font-semibold mb-2"
      }
      
      return (
        <HeadingTag 
          className={headingClasses[block.level]} 
          style={getHeadingStyle(block)}
        >
          {block.content}
        </HeadingTag>
      )

    case "paragraph":
      return (
        <p className="mb-4 leading-relaxed">
          {block.content.map((segment, index) => (
            <ContentSegmentRenderer key={index} segment={segment} />
          ))}
        </p>
      )

    case "image":
      return (
        <div className="mb-6">
          <img
            src={block.url}
            alt={block.alt}
            className="w-full rounded-lg shadow-sm"
          />
          {block.caption && (
            <p className="text-sm text-muted-foreground mt-2 text-center italic">
              {block.caption}
            </p>
          )}
        </div>
      )

    case "quote":
      return (
        <blockquote className="border-l-4 border-gray-300 pl-6 mb-6 italic">
          <div className="text-lg mb-3">
            {block.content.map((segment, index) => (
              <ContentSegmentRenderer key={index} segment={segment} />
            ))}
          </div>
          {(block.author || block.source) && (
            <footer className="text-sm text-muted-foreground">
              {block.author && <span>— {block.author}</span>}
              {block.source && <span>, {block.source}</span>}
            </footer>
          )}
        </blockquote>
      )

    case "link":
      return (
        <div className="mb-4">
          <a
            href={block.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            style={getTextStyle(block)}
          >
            {block.coverText}
          </a>
        </div>
      )

    case "list":
      const ListTag = block.listType === "ordered" ? "ol" : "ul"
      const listStyle = getTextStyle(block)
      
      return (
        <div className="mb-6">
          <h4 className="font-semibold mb-3" style={listStyle}>{block.title}</h4>
          <ListTag className={block.listType === "ordered" ? "list-decimal pl-6 space-y-2" : "list-disc pl-6 space-y-2"}>
            {block.items.map((item, index) => (
              <li key={index} style={listStyle}>
                {item.text}
                {item.subItems && item.subItems.length > 0 && (
                  <ul className="list-circle pl-4 mt-1 space-y-1">
                    {item.subItems.map((subItem, subIndex) => (
                      <li key={subIndex} className="text-sm">{subItem}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ListTag>
        </div>
      )

    default:
      return null
  }
}

export function BlogViewModal({ isOpen, onClose, blog }: BlogViewModalProps) {
  if (!blog) return null

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string | Date | undefined) => {
    if (!dateString) return 'Not available'
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published":
        return "default"
      case "Draft":
        return "secondary"
      case "Scheduled":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getActualStatus = (publishDate: string | Date, status: string) => {
    const now = new Date()
    const pubDate = new Date(publishDate)
    
    if (status === "Draft") return "Draft"
    if (pubDate <= now) return "Published"
    return "Scheduled"
  }

  const actualStatus = getActualStatus(blog.publishDate, blog.status)

  // Sort content blocks by order
  const sortedContentBlocks = [...blog.contentBlocks].sort((a, b) => a.order - b.order)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 flex-1">
                <DialogTitle className="text-3xl font-bold">{blog.title}</DialogTitle>
                {blog.featured && (
                  <Badge className="bg-yellow-500 hover:bg-yellow-600">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
              <Badge variant={getStatusColor(actualStatus)}>
                {actualStatus}
              </Badge>
            </div>
            
            {/* Blog Meta Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{blog.author}</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(blog.publishDate)}</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{blog.readTime} min read</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>{blog.views} views</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-8">
          {/* Featured Image */}
          {blog.featuredImage && (
            <div className="relative">
              <img
                src={blog.featuredImage}
                alt={blog.title}
                className="w-full h-64 object-cover rounded-lg shadow-sm"
              />
            </div>
          )}

          {/* Blog Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">CATEGORY</h3>
                <Badge variant="outline" className="text-sm">{blog.category}</Badge>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">SLUG</h3>
                <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                  /{blog.slug}
                </code>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">VERSION</h3>
                <Badge variant="outline">v{blog.version}</Badge>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">TAGS</h3>
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      <Hash className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                  {blog.tags.length === 0 && (
                    <span className="text-sm text-muted-foreground italic">No tags</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Excerpt</h3>
            <p className="text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-lg border-l-4 border-blue-500">
              {blog.excerpt}
            </p>
          </div>

          <Separator />

          {/* Content Blocks */}
          <div>
            <h3 className="font-semibold text-lg mb-6">Content</h3>
            <div className="prose prose-lg max-w-none">
              {sortedContentBlocks.map((block, index) => (
                <div key={`${block.type}-${block.order}-${index}`}>
                  <ContentBlockRenderer block={block} />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Audit Information */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Audit Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-green-700">Created</h4>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="space-y-2 text-sm">
                    <div><strong>By:</strong> {blog.createdBy.email}</div>
                    <div><strong>When:</strong> {formatDateTime(blog.createdBy.timestamp)}</div>
                    {blog.createdBy.ipAddress && (
                      <div><strong>IP:</strong> {blog.createdBy.ipAddress}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-blue-700">Last Updated</h4>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="space-y-2 text-sm">
                    <div><strong>By:</strong> {blog.updatedBy.email}</div>
                    <div><strong>When:</strong> {formatDateTime(blog.updatedBy.timestamp)}</div>
                    {blog.updatedBy.ipAddress && (
                      <div><strong>IP:</strong> {blog.updatedBy.ipAddress}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Metadata */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Metadata</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">CREATED</div>
                <div className="text-sm font-medium">{formatDateTime(blog.createdAt)}</div>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">UPDATED</div>
                <div className="text-sm font-medium">{formatDateTime(blog.updatedAt)}</div>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">STATUS</div>
                <div className="text-sm font-medium">{blog.status}</div>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">ACTIVE</div>
                <div className="text-sm font-medium">{blog.isActive ? "Yes" : "No"}</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Component to render individual content segments
function ContentSegmentRenderer({ segment }: { segment: IContentSegment }) {
  const style = {
    fontWeight: segment.bold ? 'bold' : 'normal',
    fontStyle: segment.italic ? 'italic' : 'normal',
    color: segment.color || '#000000'
  }

  if (segment.type === "link") {
    return (
      <a 
        href={segment.url} 
        target="_blank" 
        rel="noopener noreferrer"
        style={style}
        className="hover:underline text-blue-600"
      >
        {segment.content}
      </a>
    )
  }

  return <span style={style}>{segment.content}</span>
}

// Component to render content blocks
// function ContentBlockRenderer({ block }: { block: IContentBlock }) {
//   const getHeadingStyle = (block: IHeadingBlock) => ({
//     fontWeight: block.bold ? 'bold' : 'normal',
//     fontStyle: block.italic ? 'italic' : 'normal',
//     color: block.color || '#000000'
//   })

//   const getTextStyle = (block: ITextFormatting) => ({
//     fontWeight: block.bold ? 'bold' : 'normal',
//     fontStyle: block.italic ? 'italic' : 'normal',
//     color: block.color || '#000000'
//   })

//   switch (block.type) {
//     case "heading":
//       const HeadingTag = `h${block.level}` as keyof JSX.IntrinsicElements
//       const headingClasses = {
//         1: "text-4xl font-bold mb-6 mt-8 first:mt-0",
//         2: "text-3xl font-semibold mb-5 mt-7",
//         3: "text-2xl font-semibold mb-4 mt-6",
//         4: "text-xl font-semibold mb-3 mt-5",
//         5: "text-lg font-semibold mb-3 mt-4",
//         6: "text-base font-semibold mb-2 mt-3"
//       }
      
//       return (
//         <HeadingTag 
//           className={headingClasses[block.level]} 
//           style={getHeadingStyle(block)}
//         >
//           {block.content}
//         </HeadingTag>
//       )

//     case "paragraph":
//       return (
//         <p className="mb-4 leading-relaxed text-gray-700">
//           {block.content.map((segment, index) => (
//             <ContentSegmentRenderer key={index} segment={segment} />
//           ))}
//         </p>
//       )

//     case "image":
//       return (
//         <figure className="mb-6">
//           <img
//             src={block.url}
//             alt={block.alt}
//             className="w-full rounded-lg shadow-sm border"
//           />
//           {block.caption && (
//             <figcaption className="text-sm text-muted-foreground mt-3 text-center italic">
//               {block.caption}
//             </figcaption>
//           )}
//         </figure>
//       )

//     case "quote":
//       return (
//         <blockquote className="border-l-4 border-gray-400 pl-6 py-2 mb-6 bg-muted/30 rounded-r-lg">
//           <div className="text-lg mb-3 italic text-gray-700">
//             "{block.content.map((segment, index) => (
//               <ContentSegmentRenderer key={index} segment={segment} />
//             ))}"
//           </div>
//           {(block.author || block.source) && (
//             <footer className="text-sm text-muted-foreground font-medium">
//               {block.author && <span>— {block.author}</span>}
//               {block.source && <span>{block.author ? ", " : "— "}{block.source}</span>}
//             </footer>
//           )}
//         </blockquote>
//       )

//     case "link":
//       return (
//         <div className="mb-4">
//           <a
//             href={block.url}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="inline-flex items-center px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors shadow-sm"
//             style={getTextStyle(block)}
//           >
//             <span className="font-medium">{block.coverText}</span>
//             <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
//             </svg>
//           </a>
//         </div>
//       )

//     case "list":
//       const ListTag = block.listType === "ordered" ? "ol" : "ul"
//       const listStyle = getTextStyle(block)
      
//       return (
//         <div className="mb-6">
//           <h4 className="font-semibold mb-3 text-gray-800" style={listStyle}>
//             {block.title}
//           </h4>
//           <ListTag 
//             className={
//               block.listType === "ordered" 
//                 ? "list-decimal pl-6 space-y-2 text-gray-700" 
//                 : "list-disc pl-6 space-y-2 text-gray-700"
//             }
//             style={listStyle}
//           >
//             {block.items.map((item, index) => (
//               <li key={index}>
//                 <span>{item.text}</span>
//                 {item.subItems && item.subItems.length > 0 && (
//                   <ul className="list-circle pl-4 mt-2 space-y-1">
//                     {item.subItems.map((subItem, subIndex) => (
//                       <li key={subIndex} className="text-sm text-gray-600">
//                         {subItem}
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </li>
//             ))}
//           </ListTag>
//         </div>
//       )

//     default:
//       return null
//   }
// }