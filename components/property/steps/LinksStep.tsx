// components/property/steps/LinksStep.tsx
"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { AlertCircle, Building2, Users, Home, User, Search, X, CheckCircle } from "lucide-react"
import type { PropertyFormData, PropertyStepProps } from "@/types/properties"

interface DropdownItem {
  id: string
  name: string
  slug: string
}

// Developer Search Component
const DeveloperSearch = ({ 
  developers, 
  value, 
  onChange, 
  error 
}: {
  developers: DropdownItem[];
  value: string;
  onChange: (developer: DropdownItem) => void;
  error?: string;
}) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const filteredDevelopers = useMemo(() => {
    if (!searchTerm.trim()) return developers
    return developers.filter(dev => 
      dev.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [developers, searchTerm])

  const selectedDeveloper = developers.find(dev => dev.name === value)
  const hasValue = selectedDeveloper && selectedDeveloper.name

  return (
    <div className="space-y-2">
      <Label className={`text-sm font-medium flex items-center gap-1 ${hasValue ? 'text-green-600' : ''}`}>
        {hasValue && <CheckCircle className="h-3 w-3" />}
        Developer Name
      </Label>
      <div className="relative">
        <div className="flex">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => {
              setTimeout(() => setIsOpen(false), 200)
            }}
            placeholder="Search developers..."
            className={`pr-10 ${error ? 'border-red-500' : hasValue ? 'border-green-500' : ''}`}
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        
        {isOpen && filteredDevelopers.length > 0 && (
          <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto mt-1">
            {filteredDevelopers.map((developer) => (
              <button
                key={developer.id}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50"
                onMouseDown={() => {
                  onChange(developer)
                  setSearchTerm("")
                  setIsOpen(false)
                }}
              >
                {developer.name}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {selectedDeveloper && (
        <div className="p-2 bg-green-50 border border-green-200 rounded flex justify-between items-center">
          <span className="text-sm">Selected: {selectedDeveloper.name}</span>
          <button
            type="button"
            onClick={() => onChange({ id: "", name: "", slug: "" })}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {error && (
        <span className="text-red-500 text-xs flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </span>
      )}
    </div>
  )
}

// Project Search Component
const ProjectSearch = ({ 
  projects, 
  value, 
  onChange, 
  error 
}: {
  projects: DropdownItem[];
  value: string;
  onChange: (project: DropdownItem) => void;
  error?: string;
}) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return projects
    return projects.filter(project => 
      project.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [projects, searchTerm])

  const selectedProject = projects.find(project => project.name === value)
  const hasValue = selectedProject && selectedProject.name

  return (
    <div className="space-y-2">
      <Label className={`text-sm font-medium flex items-center gap-1 ${hasValue ? 'text-green-600' : ''}`}>
        {hasValue && <CheckCircle className="h-3 w-3" />}
        Project Name
      </Label>
      <div className="relative">
        <div className="flex">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => {
              setTimeout(() => setIsOpen(false), 200)
            }}
            placeholder="Search projects..."
            className={`pr-10 ${error ? 'border-red-500' : hasValue ? 'border-green-500' : ''}`}
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        
        {isOpen && filteredProjects.length > 0 && (
          <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto mt-1">
            {filteredProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50"
                onMouseDown={() => {
                  onChange(project)
                  setSearchTerm("")
                  setIsOpen(false)
                }}
              >
                {project.name}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {selectedProject && (
        <div className="p-2 bg-green-50 border border-green-200 rounded flex justify-between items-center">
          <span className="text-sm">Selected: {selectedProject.name}</span>
          <button
            type="button"
            onClick={() => onChange({ id: "", name: "", slug: "" })}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {error && (
        <span className="text-red-500 text-xs flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </span>
      )}
    </div>
  )
}

export function LinksStep({ formData, errors, setErrors, onInputChange }: PropertyStepProps) {
  // Toggle states for each linking section
  const [hasProject, setHasProject] = useState(false)
  const [hasDeveloper, setHasDeveloper] = useState(false)
  const [hasCommunity, setHasCommunity] = useState(false)
  const [hasAgent, setHasAgent] = useState(false)
  
  // API data states
  const [developers, setDevelopers] = useState<DropdownItem[]>([])
  const [projects, setProjects] = useState<DropdownItem[]>([])
  const [developersLoading, setDevelopersLoading] = useState(false)
  const [projectsLoading, setProjectsLoading] = useState(false)

  // Initialize toggle states based on existing data
  useEffect(() => {
    setHasProject(!!(formData.projectName || formData.projectSlug))
    setHasDeveloper(!!(formData.developerName || formData.developerSlug))
    setHasCommunity(!!(formData.communityName || formData.communitySlug))
    setHasAgent(!!(formData.agentId || formData.agentName || formData.agentPhone || formData.agentEmail))
  }, [formData])

  // Fetch developers when toggle is enabled
  useEffect(() => {
    if (hasDeveloper && developers.length === 0) {
      setDevelopersLoading(true)
      fetch("/api/developers/dropdown")
        .then(res => res.json())
        .then(json => {
          if (json.success) {
            setDevelopers(json.data)
          }
        })
        .catch(err => console.error("Error fetching developers:", err))
        .finally(() => setDevelopersLoading(false))
    }
  }, [hasDeveloper])

  // Fetch projects when toggle is enabled
  useEffect(() => {
    if (hasProject && projects.length === 0) {
      setProjectsLoading(true)
      fetch("/api/projects/dropdown")
        .then(res => res.json())
        .then(json => {
          if (json.success) {
            setProjects(json.data)
          }
        })
        .catch(err => console.error("Error fetching projects:", err))
        .finally(() => setProjectsLoading(false))
    }
  }, [hasProject])

  const handleFieldChange = (field: keyof PropertyFormData, value: any) => {
    onInputChange(field, value)
    
    // Clear field error when user starts typing
    if (errors[field]) {
      const newErrors = { ...errors }
      delete newErrors[field]
      setErrors(newErrors)
    }
  }

  // Handle developer selection
  const handleDeveloperChange = (developer: DropdownItem) => {
    handleFieldChange('developerName', developer.name)
    handleFieldChange('developerSlug', developer.slug)
  }

  // Handle project selection
  const handleProjectChange = (project: DropdownItem) => {
    handleFieldChange('projectName', project.name)
    handleFieldChange('projectSlug', project.slug)
  }

  // Clear fields when toggle is disabled
  const handleProjectToggle = (enabled: boolean) => {
    setHasProject(enabled)
    if (!enabled) {
      handleFieldChange('projectName', '')
      handleFieldChange('projectSlug', '')
    }
  }

  const handleDeveloperToggle = (enabled: boolean) => {
    setHasDeveloper(enabled)
    if (!enabled) {
      handleFieldChange('developerName', '')
      handleFieldChange('developerSlug', '')
    }
  }

  const handleCommunityToggle = (enabled: boolean) => {
    setHasCommunity(enabled)
    if (!enabled) {
      handleFieldChange('communityName', '')
      handleFieldChange('communitySlug', '')
    }
  }

  const handleAgentToggle = (enabled: boolean) => {
    setHasAgent(enabled)
    if (!enabled) {
      handleFieldChange('agentId', '')
      handleFieldChange('agentName', '')
      handleFieldChange('agentPhone', '')
      handleFieldChange('agentEmail', '')
    }
  }

  return (
    <div className="space-y-6">
      {/* Project Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-600" />
            Project Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable Project Link */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label className="text-sm font-medium">Link to Project</Label>
              <p className="text-xs text-gray-500">Connect this property to a project</p>
            </div>
            <Switch
              checked={hasProject}
              onCheckedChange={handleProjectToggle}
            />
          </div>

          {/* Project Details */}
          {hasProject && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProjectSearch
                  projects={projects}
                  value={formData.projectName || ''}
                  onChange={handleProjectChange}
                  error={errors.projectName}
                />
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">
                    Project Slug (Auto-generated)
                  </Label>
                  <Input
                    value={formData.projectSlug || ''}
                    placeholder="Auto-generated from selection"
                    className="bg-gray-100 text-gray-500"
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Developer Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Developer Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable Developer Link */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label className="text-sm font-medium">Link to Developer</Label>
              <p className="text-xs text-gray-500">Connect this property to a developer</p>
            </div>
            <Switch
              checked={hasDeveloper}
              onCheckedChange={handleDeveloperToggle}
            />
          </div>

          {/* Developer Details */}
          {hasDeveloper && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DeveloperSearch
                  developers={developers}
                  value={formData.developerName || ''}
                  onChange={handleDeveloperChange}
                  error={errors.developerName}
                />
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">
                    Developer Slug (Auto-generated)
                  </Label>
                  <Input
                    value={formData.developerSlug || ''}
                    placeholder="Auto-generated from selection"
                    className="bg-gray-100 text-gray-500"
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Community Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-purple-600" />
            Community Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable Community Link */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label className="text-sm font-medium">Link to Community</Label>
              <p className="text-xs text-gray-500">Connect this property to a community</p>
            </div>
            <Switch
              checked={hasCommunity}
              onCheckedChange={handleCommunityToggle}
            />
          </div>

          {/* Community Details */}
          {hasCommunity && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="communityName" className="text-sm font-medium">
                    Community Name
                  </Label>
                  <Input
                    id="communityName"
                    placeholder="e.g., Dubai Marina"
                    value={formData.communityName}
                    onChange={(e) => handleFieldChange('communityName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="communitySlug" className="text-sm font-medium">
                    Community Slug
                  </Label>
                  <Input
                    id="communitySlug"
                    placeholder="e.g., dubai-marina"
                    value={formData.communitySlug}
                    onChange={(e) => handleFieldChange('communitySlug', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-orange-600" />
            Agent Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable Agent Information */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label className="text-sm font-medium">Add Agent Information</Label>
              <p className="text-xs text-gray-500">Include agent contact details for this property</p>
            </div>
            <Switch
              checked={hasAgent}
              onCheckedChange={handleAgentToggle}
            />
          </div>

          {/* Agent Details */}
          {hasAgent && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agentId" className="text-sm font-medium">
                    Agent ID *
                  </Label>
                  <Input
                    id="agentId"
                    placeholder="e.g., AGT001"
                    value={formData.agentId}
                    onChange={(e) => handleFieldChange('agentId', e.target.value)}
                    className={errors.agentId ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {errors.agentId && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {errors.agentId}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agentName" className="text-sm font-medium">
                    Agent Name *
                  </Label>
                  <Input
                    id="agentName"
                    placeholder="e.g., John Smith"
                    value={formData.agentName}
                    onChange={(e) => handleFieldChange('agentName', e.target.value)}
                    className={errors.agentName ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {errors.agentName && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {errors.agentName}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agentPhone" className="text-sm font-medium">
                    Agent Phone *
                  </Label>
                  <Input
                    id="agentPhone"
                    placeholder="e.g., +971 50 123 4567"
                    value={formData.agentPhone}
                    onChange={(e) => handleFieldChange('agentPhone', e.target.value)}
                    className={errors.agentPhone ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {errors.agentPhone && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {errors.agentPhone}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agentEmail" className="text-sm font-medium">
                    Agent Email
                  </Label>
                  <Input
                    id="agentEmail"
                    type="email"
                    placeholder="e.g., john.smith@agency.com"
                    value={formData.agentEmail}
                    onChange={(e) => handleFieldChange('agentEmail', e.target.value)}
                    className={errors.agentEmail ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {errors.agentEmail && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {errors.agentEmail}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
