import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Globe, Mail, Phone, Star } from "lucide-react"

interface Developer {
  _id?: string
  name: string
  slug?: string
  logo: string
  coverImage?: string
  description: string
  location: string
  establishedYear: number
  totalProjects: number
  activeProjects: number
  completedProjects: number
  website: string
  email: string
  phone: string
  specialization: string[]
  rating: number
  verified: boolean
}

interface DeveloperViewModalProps {
  isOpen: boolean
  onClose: () => void
  developer: Developer | null
}

export function DeveloperViewModal({ isOpen, onClose, developer }: DeveloperViewModalProps) {
  if (!developer) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-4">
            <img
              src={developer.logo[0] || "/placeholder.svg"}
              alt={developer.name}
              className="w-16 h-16 object-cover rounded-lg border"
            />
            <div>
              <DialogTitle className="text-2xl">{developer.name}</DialogTitle>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  {developer.location}
                </div>
                {developer.verified && <Badge variant="default">Verified</Badge>}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{developer.totalProjects}</div>
              <div className="text-sm text-muted-foreground">Total Projects</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{developer.activeProjects}</div>
              <div className="text-sm text-muted-foreground">Active Projects</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{developer.completedProjects}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{developer.rating}</div>
              <div className="text-sm text-muted-foreground">Rating</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Established:</span>
                <span>{developer.establishedYear}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Website:</span>
                <a
                  href={`https://${developer.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {developer.website}
                </a>
              </div>

              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Email:</span>
                <a href={`mailto:${developer.email}`} className="text-blue-600 hover:underline">
                  {developer.email}
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Phone:</span>
                <a href={`tel:${developer.phone}`} className="text-blue-600 hover:underline">
                  {developer.phone}
                </a>
              </div>

              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Rating:</span>
                <span>{developer.rating}/5.0</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Description</h3>
            <p className="text-muted-foreground leading-relaxed">{developer.description}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Specialization</h3>
            <div className="flex flex-wrap gap-2">
              {developer.specialization.map((spec, index) => (
                <Badge key={index} variant="outline">
                  {spec}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
