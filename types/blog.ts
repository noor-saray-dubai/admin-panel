// Blog types for TypeScript components

export interface Blog {
  _id?: string
  title: string
  slug?: string
  excerpt: string
  contentBlocks: any[] // Content blocks array
  featuredImage?: string
  author: string
  category: string
  tags: string[]
  status: "Published" | "Draft" | "Scheduled"
  publishDate: string | Date
  readTime: number
  views: number
  featured: boolean
  createdBy: {
    email: string
    timestamp: Date | string
    ipAddress?: string
    userAgent?: string
  }
  updatedBy: {
    email: string
    timestamp: Date | string
    ipAddress?: string
    userAgent?: string
  }
  version: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface BlogCardProps {
  blog: Blog
  onEdit?: (blog: Blog) => void
  onDelete?: (blog: Blog) => void
  onView?: (blog: Blog) => void
}

export interface BlogViewModalProps {
  isOpen: boolean
  blog: Blog | null
  onClose: () => void
  onEdit?: () => void
  onDelete: () => void
}
