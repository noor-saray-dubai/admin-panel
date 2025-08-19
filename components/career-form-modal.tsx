"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { X, Plus, Trash2, Eye } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Define the career interface matching your schema
interface ICareer {
  _id?: string
  id?: string
  slug?: string
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
  applicationsCount?: number
  featured: boolean
  createdAt?: string
  updatedAt?: string
}

interface CareerFormData {
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

interface CareerFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (careerData: any) => void
  career?: ICareer | null
  mode: 'add' | 'edit'
}

const departments = [
  "Development",
  "Sales",
  "Marketing",
  "Design",
  "Finance",
  "Legal",
  "Operations",
  "Human Resources",
  "IT",
  "Customer Service",
]

const locations = [
  "Dubai, UAE",
  "Abu Dhabi, UAE",
  "Sharjah, UAE",
  "Ajman, UAE",
  "Remote",
  "Hybrid"
]

const initialFormData: CareerFormData = {
  title: "",
  department: "",
  location: "",
  type: "Full-time",
  level: "Mid",
  salary: "",
  description: "",
  requirements: [],
  responsibilities: [],
  benefits: [],
  status: "Active",
  postedDate: new Date().toISOString(),
  applicationDeadline: "",
  applicationsCount: 0,
  featured: false,
}

export function CareerFormModal({ isOpen, onClose, onSave, career, mode }: CareerFormModalProps) {
  const [formData, setFormData] = useState<CareerFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Input fields for array items
  const [requirementInput, setRequirementInput] = useState("")
  const [responsibilityInput, setResponsibilityInput] = useState("")
  const [benefitInput, setBenefitInput] = useState("")

  // Convert career data to form data format
  const convertCareerToFormData = (career: ICareer): CareerFormData => {
    return {
      title: career.title || "",
      department: career.department || "",
      location: career.location || "",
      type: career.type || "Full-time",
      level: career.level || "Mid",
      salary: career.salary || "",
      description: career.description || "",
      requirements: career.requirements || [],
      responsibilities: career.responsibilities || [],
      benefits: career.benefits || [],
      status: career.status || "Active",
      postedDate: career.postedDate ? career.postedDate.split('T')[0] : new Date().toISOString().split('T')[0],
      applicationDeadline: career.applicationDeadline ? career.applicationDeadline.split('T')[0] : "",
      applicationsCount: career.applicationsCount || 0,
      featured: career.featured || false,
    }
  }

  // Initialize form data based on mode
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && career) {
        const convertedData = convertCareerToFormData(career)
        setFormData(convertedData)
      } else {
        // Reset form for add mode
        setFormData({
          ...initialFormData,
          postedDate: new Date().toISOString().split('T')[0]
        })
      }
      // Reset input fields
      setRequirementInput("")
      setResponsibilityInput("")
      setBenefitInput("")
    }
  }, [isOpen, mode, career])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (field: keyof CareerFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Requirements functions
  const addRequirement = () => {
    if (requirementInput.trim() && !formData.requirements.includes(requirementInput.trim())) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, requirementInput.trim()]
      }))
      setRequirementInput("")
    }
  }

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }))
  }

  // Responsibilities functions
  const addResponsibility = () => {
    if (responsibilityInput.trim() && !formData.responsibilities.includes(responsibilityInput.trim())) {
      setFormData(prev => ({
        ...prev,
        responsibilities: [...prev.responsibilities, responsibilityInput.trim()]
      }))
      setResponsibilityInput("")
    }
  }

  const removeResponsibility = (index: number) => {
    setFormData(prev => ({
      ...prev,
      responsibilities: prev.responsibilities.filter((_, i) => i !== index)
    }))
  }

  // Benefits functions
  const addBenefit = () => {
    if (benefitInput.trim() && !formData.benefits.includes(benefitInput.trim())) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, benefitInput.trim()]
      }))
      setBenefitInput("")
    }
  }

  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      action()
    }
  }

  // Fill with test data
  const fillFakeData = () => {
    setFormData({
      title: "Senior Full Stack Developer",
      department: "Development",
      location: "Dubai, UAE",
      type: "Full-time",
      level: "Senior",
      salary: "AED 25,000 - 35,000",
      description: "We are seeking an experienced Full Stack Developer to join our innovative team. The ideal candidate will have strong expertise in modern web technologies and a passion for building scalable applications.",
      requirements: [
        "Bachelor's degree in Computer Science or related field",
        "5+ years of experience in full stack development",
        "Proficiency in React, Node.js, and TypeScript",
        "Experience with cloud platforms (AWS/Azure/GCP)",
        "Strong understanding of database design and optimization",
        "Excellent problem-solving skills"
      ],
      responsibilities: [
        "Design and develop scalable web applications",
        "Collaborate with cross-functional teams",
        "Implement best practices for code quality and security",
        "Mentor junior developers",
        "Participate in code reviews and technical discussions",
        "Contribute to architectural decisions"
      ],
      benefits: [
        "Competitive salary package",
        "Health insurance for employee and family",
        "Annual flight tickets",
        "Professional development budget",
        "Flexible working hours",
        "Remote work options"
      ],
      status: "Active",
      postedDate: new Date().toISOString().split('T')[0],
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      applicationsCount: 0,
      featured: true,
    })
  }

  // Validate form
  const validateForm = (): string[] => {
    const errors: string[] = []

    if (!formData.title.trim()) errors.push("Job title is required")
    if (!formData.department.trim()) errors.push("Department is required")
    if (!formData.location.trim()) errors.push("Location is required")
    if (!formData.salary.trim()) errors.push("Salary range is required")
    if (!formData.description.trim()) errors.push("Job description is required")
    if (!formData.applicationDeadline) errors.push("Application deadline is required")
    
    // Validate arrays
    if (formData.requirements.length === 0) errors.push("At least one requirement is needed")
    if (formData.responsibilities.length === 0) errors.push("At least one responsibility is needed")
    if (formData.benefits.length === 0) errors.push("At least one benefit is needed")

    // Date validations
    if (formData.applicationDeadline) {
      const deadline = new Date(formData.applicationDeadline)
      const posted = new Date(formData.postedDate)
      if (deadline <= posted) {
        errors.push("Application deadline must be after posted date")
      }
    }

    return errors
  }

  // Debug helper function
  const debugFormData = () => {
    console.group("🐛 Career Form Data Debug Info")
    
    console.log("Basic Info:", {
      title: formData.title,
      department: formData.department,
      location: formData.location,
      type: formData.type,
      level: formData.level,
      salary: formData.salary,
      status: formData.status,
      featured: formData.featured
    })

    console.log("Dates:", {
      postedDate: formData.postedDate,
      applicationDeadline: formData.applicationDeadline,
      applicationsCount: formData.applicationsCount
    })

    console.log("Content:", {
      descriptionLength: formData.description?.length,
      requirementsCount: formData.requirements?.length,
      responsibilitiesCount: formData.responsibilities?.length,
      benefitsCount: formData.benefits?.length
    })

    console.groupEnd()
  }

  // Handle form submission
  const handleSubmit = async () => {
    console.log("🚀 Starting career form submission...")
    
    // Debug form data
    debugFormData()
    
    // Client-side validation
    const errors = validateForm()
    if (errors.length > 0) {
      console.error("❌ Client-side validation failed:", errors)
      toast.error(`Please fix the following errors:\n${errors.join('\n')}`)
      return
    }

    console.log("✅ Client-side validation passed")

    setIsSubmitting(true)
    try {
      // Prepare career data
      const careerDataToSend = {
        ...formData,
        postedDate: new Date(formData.postedDate).toISOString(),
        applicationDeadline: new Date(formData.applicationDeadline).toISOString(),
        // Clean up arrays
        requirements: formData.requirements.filter(req => req.trim()),
        responsibilities: formData.responsibilities.filter(resp => resp.trim()),
        benefits: formData.benefits.filter(benefit => benefit.trim()),
      }

      console.log("📤 Career data to send:", careerDataToSend)

      // Use different endpoints based on mode
      const url = mode === 'edit' && career 
        ? `/api/careers/update/${career.slug || career.id}` 
        : "/api/careers/add"
      
      const method = mode === 'edit' ? 'PUT' : 'POST'

      console.log(`🌐 Making ${method} request to ${url}`)

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(careerDataToSend),
      })

      console.log(`📡 Response status: ${res.status} ${res.statusText}`)

      let data
      try {
        data = await res.json()
        console.log("📥 Response data:", data)
      } catch (parseError) {
        console.error("❌ Failed to parse response JSON:", parseError)
        throw new Error("Invalid response format from server")
      }

      if (!res.ok) {
        console.error("❌ Server responded with error:", data)
        throw new Error(data?.message || "Something went wrong")
      }

      console.log("✅ Career saved successfully!")
      toast.success(`Career ${mode === 'edit' ? 'updated' : 'created'} successfully!`)
      
      // Call the onSave callback to refresh the parent component
      if (onSave) {
        onSave(data)
      }
      
      handleClose()

    } catch (err: any) {
      console.error("❌ Save failed with error:", err)
      toast.error(`Failed to ${mode === 'edit' ? 'update' : 'create'} career: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData(initialFormData)
    setRequirementInput("")
    setResponsibilityInput("")
    setBenefitInput("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold">
            {mode === 'edit' ? 'Edit Career' : 'Add New Career'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
          <div className="space-y-6 py-4">

            {/* Basic Info Section */}
            <Card>
              <CardHeader>
                <CardTitle>Career Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Senior Full Stack Developer"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department *</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => handleSelectChange('department', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Select
                      value={formData.location}
                      onValueChange={(value) => handleSelectChange('location', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc} value={loc}>
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="salary">Salary Range *</Label>
                    <Input
                      id="salary"
                      placeholder="e.g., AED 15,000 - 25,000"
                      name="salary"
                      value={formData.salary}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="type">Employment Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleSelectChange('type', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="level">Experience Level *</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value) => handleSelectChange('level', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Entry">Entry</SelectItem>
                        <SelectItem value="Mid">Mid</SelectItem>
                        <SelectItem value="Senior">Senior</SelectItem>
                        <SelectItem value="Executive">Executive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleSelectChange('status', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Paused">Paused</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postedDate">Posted Date *</Label>
                    <Input
                      id="postedDate"
                      type="date"
                      name="postedDate"
                      value={formData.postedDate}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="applicationDeadline">Application Deadline *</Label>
                    <Input
                      id="applicationDeadline"
                      type="date"
                      name="applicationDeadline"
                      value={formData.applicationDeadline}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Enter detailed job description..."
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  className="mt-1"
                />
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Requirements *</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a requirement and press Enter or click Add"
                    value={requirementInput}
                    onChange={(e) => setRequirementInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, addRequirement)}
                  />
                  <Button type="button" onClick={addRequirement}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {formData.requirements.map((req, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{req}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRequirement(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {formData.requirements.length === 0 && (
                  <p className="text-sm text-gray-500">No requirements added yet</p>
                )}
              </CardContent>
            </Card>

            {/* Responsibilities */}
            <Card>
              <CardHeader>
                <CardTitle>Responsibilities *</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a responsibility and press Enter or click Add"
                    value={responsibilityInput}
                    onChange={(e) => setResponsibilityInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, addResponsibility)}
                  />
                  <Button type="button" onClick={addResponsibility}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {formData.responsibilities.map((resp, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{resp}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeResponsibility(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {formData.responsibilities.length === 0 && (
                  <p className="text-sm text-gray-500">No responsibilities added yet</p>
                )}
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle>Benefits *</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a benefit and press Enter or click Add"
                    value={benefitInput}
                    onChange={(e) => setBenefitInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, addBenefit)}
                  />
                  <Button type="button" onClick={addBenefit}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {formData.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{benefit}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBenefit(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {formData.benefits.length === 0 && (
                  <p className="text-sm text-gray-500">No benefits added yet</p>
                )}
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, featured: !!checked }))
                    }
                  />
                  <Label htmlFor="featured" className="font-normal">
                    Featured Position (Will appear in featured careers section)
                  </Label>
                </div>
                
                {mode === 'edit' && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">
                      Applications Count: <span className="font-semibold">{formData.applicationsCount}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preview Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Career Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Job Header */}
                <div className="border-b pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-2xl font-bold">{formData.title || "Job Title"}</h3>
                      <p className="text-gray-600">{formData.department || "Department"} • {formData.location || "Location"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {formData.featured && <Badge className="bg-yellow-500">Featured</Badge>}
                      <Badge variant={
                        formData.status === 'Active' ? 'default' : 
                        formData.status === 'Paused' ? 'secondary' : 
                        'destructive'
                      }>
                        {formData.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                    <div>
                      <span className="font-medium">Type:</span>
                      <p>{formData.type}</p>
                    </div>
                    <div>
                      <span className="font-medium">Level:</span>
                      <p>{formData.level}</p>
                    </div>
                    <div>
                      <span className="font-medium">Salary:</span>
                      <p className="font-semibold text-green-600">{formData.salary || "Not specified"}</p>
                    </div>
                    <div>
                      <span className="font-medium">Deadline:</span>
                      <p>{formData.applicationDeadline ? new Date(formData.applicationDeadline).toLocaleDateString() : "Not set"}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {formData.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Job Description</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{formData.description}</p>
                  </div>
                )}

                {/* Requirements */}
                {formData.requirements.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Requirements</h4>
                    <ul className="space-y-2">
                      {formData.requirements.map((req, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span className="text-gray-700">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Responsibilities */}
                {formData.responsibilities.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Responsibilities</h4>
                    <ul className="space-y-2">
                      {formData.responsibilities.map((resp, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span className="text-gray-700">{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Benefits */}
                {formData.benefits.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Benefits</h4>
                    <ul className="space-y-2">
                      {formData.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={fillFakeData}
                className="text-sm"
              >
                Fill Sample Data
              </Button>
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting 
                    ? "Saving..." 
                    : mode === 'edit' 
                      ? 'Update Career' 
                      : 'Create Career'
                  }
                </Button>
              </div>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}