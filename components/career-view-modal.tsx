import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Briefcase, MapPin, Calendar, Clock, DollarSign, Users } from "lucide-react"


interface Career {
  _id: string
  title: string
  department: string
  location: string
  type: "Full-time" | "Part-time" | "Contract" | "Internship"
  level: "Entry" | "Mid" | "Senior" | "Executive"
  salary: string
  description: string
  requirements: string[]
  responsibilities: string[]
  benefits: string[]
  status: "Active" | "Paused" | "Closed"
  postedDate: string
  applicationDeadline: string
  applicationsCount: number
  featured: boolean
}

interface CareerViewModalProps {
  isOpen: boolean
  onClose: () => void
  career: Career | null
}

export function CareerViewModal({ isOpen, onClose, career }: CareerViewModalProps) {
  if (!career) return null

  const formatDate = (dateString: string) => {
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
      case "Active":
        return "default"
      case "Paused":
        return "secondary"
      case "Closed":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Full-time":
        return "bg-blue-100 text-blue-800"
      case "Part-time":
        return "bg-green-100 text-green-800"
      case "Contract":
        return "bg-orange-100 text-orange-800"
      case "Internship":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getDaysRemaining = (deadline: string) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysRemaining = getDaysRemaining(career.applicationDeadline)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <DialogTitle className="text-2xl">{career.title}</DialogTitle>
              {career.featured && <Badge className="bg-yellow-500">Featured</Badge>}
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Briefcase className="h-4 w-4" />
                <span>{career.department}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{career.location}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Posted {formatDate(career.postedDate)}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Type Badges */}
          <div className="flex items-center space-x-2">
            <Badge variant={getStatusColor(career.status)}>{career.status}</Badge>
            <Badge className={`text-xs ${getTypeColor(career.type)}`}>{career.type}</Badge>
            <Badge variant="outline" className="text-xs">
              {career.level} Level
            </Badge>
          </div>

          {/* Key Information */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="font-medium">Salary:</span>
                <span className="text-green-600 font-semibold">{career.salary}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Applications:</span>
                <span>{career.applicationsCount}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="font-medium">Deadline:</span>
                <span className={daysRemaining <= 7 ? "text-red-600 font-medium" : ""}>
                  {formatDate(career.applicationDeadline)}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Days Remaining:</span>
                <span className={daysRemaining <= 7 ? "text-red-600 font-medium" : ""}>
                  {daysRemaining > 0 ? `${daysRemaining} days` : "Expired"}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Job Description</h3>
            <p className="text-muted-foreground leading-relaxed">{career.description}</p>
          </div>

          {/* Requirements */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Requirements</h3>
            <ul className="space-y-2">
              {career.requirements.map((requirement, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span className="text-muted-foreground">{requirement}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Responsibilities */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Key Responsibilities</h3>
            <ul className="space-y-2">
              {career.responsibilities.map((responsibility, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span className="text-muted-foreground">{responsibility}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Benefits & Perks</h3>
            <ul className="space-y-2">
              {career.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span className="text-muted-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
