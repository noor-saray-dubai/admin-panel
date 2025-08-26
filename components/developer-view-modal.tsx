import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MapPin, Calendar, Globe, Mail, Phone, Award, CheckCircle2, Clock, User } from "lucide-react"

interface IDescriptionSection {
  title?: string
  description: string
}

interface IAward {
  name: string
  year: number
}

interface Developer {
  _id?: string
  name: string
  slug?: string
  logo: string
  coverImage: string
  description: IDescriptionSection[]
  overview: string
  location: string
  establishedYear: number
  website: string
  email: string
  phone: string
  specialization: string[]
  awards: IAward[]
  verified: boolean
  createdAt: string
  updatedAt: string
}

interface DeveloperViewModalProps {
  isOpen: boolean
  onClose: () => void
  developer: Developer | null
}

export function DeveloperViewModal({ isOpen, onClose, developer }: DeveloperViewModalProps) {
  if (!developer) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  console.log(developer);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-4">
            <img
              src={developer.logo || "/placeholder.svg"}
              alt={developer.name}
              className="w-16 h-16 object-cover rounded-lg border"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <DialogTitle className="text-2xl">{developer.name}</DialogTitle>
                {developer.verified && (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                )}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  {developer.location}
                </div>
                <Badge variant={developer.verified ? "default" : "secondary"}>
                  {developer.verified ? "Verified" : "Unverified"}
                </Badge>
              </div>
              <div className="flex items-center space-x-1 mt-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Established {developer.establishedYear}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cover Image */}
          {developer.coverImage && (
            <div className="w-full h-48 rounded-lg overflow-hidden">
              <img
                src={developer.coverImage}
                alt={`${developer.name} cover`}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Overview Section */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Overview</h3>
            <p className="text-muted-foreground leading-relaxed">{developer.overview}</p>
          </div>

          {/* Description Sections */}
          {developer.description && developer.description.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">About</h3>
              <div className="space-y-4">
                {developer.description.map((section, index) => (
                  <div key={index} className="space-y-2">
                    {section.title && (
                      <h4 className="font-medium text-base">{section.title}</h4>
                    )}
                    <p className="text-muted-foreground leading-relaxed">
                      {section.description}
                    </p>
                    {index < developer.description.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              
              {developer.website && (
                <div className="flex items-center space-x-3">
                  <Globe className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="font-medium">Website</div>
                    <a
                      href={developer.website.startsWith('http') ? developer.website : `https://${developer.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {developer.website}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="font-medium">Email</div>
                  <a 
                    href={`mailto:${developer.email}`} 
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {developer.email}
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="font-medium">Phone</div>
                  <a 
                    href={`tel:${developer.phone}`} 
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {developer.phone}
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Audit Information</h3>
              
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="font-medium">Created</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(developer.createdAt)}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="font-medium">Last Updated</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(developer.updatedAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Specialization */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Specialization</h3>
            <div className="flex flex-wrap gap-2">
              {developer.specialization.map((spec, index) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {spec}
                </Badge>
              ))}
            </div>
          </div>

          {/* Awards */}
          {developer.awards && developer.awards.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Awards & Recognition</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {developer.awards.map((award, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Award className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{award.name}</div>
                      <div className="text-sm text-muted-foreground">{award.year}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}