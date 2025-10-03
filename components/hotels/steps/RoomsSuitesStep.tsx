// components/hotels/steps/RoomsSuitesStep.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, X, Bed, Users, Wifi, Car, Coffee, Tv, Wind, Bath, Sofa, Utensils, AlertCircle } from "lucide-react"
import { ValidatedInput } from "../ValidatedInput"
import { ValidatedTextarea } from "../ValidatedTextarea"
import type { HotelFormData, IRoomSuite } from "@/types/hotels"

interface RoomsSuitesStepProps {
  formData: HotelFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onInputChange: (field: string, value: any) => void
}

// Room/Suite features with icons
const roomFeatures = {
  wifi: { label: "Free WiFi", icon: Wifi },
  airConditioning: { label: "Air Conditioning", icon: Wind },
  minibar: { label: "Minibar", icon: Coffee },
  tv: { label: "Smart TV", icon: Tv },
  balcony: { label: "Private Balcony", icon: Sofa },
  bathTub: { label: "Bath Tub", icon: Bath },
  roomService: { label: "Room Service", icon: Utensils },
  parking: { label: "Parking Space", icon: Car },
  seaView: { label: "Sea View", icon: Users },
  cityView: { label: "City View", icon: Users },
  kitchenette: { label: "Kitchenette", icon: Utensils },
  livingArea: { label: "Separate Living Area", icon: Sofa },
}

export function RoomsSuitesStep({
  formData,
  errors,
  setErrors,
  onInputChange
}: RoomsSuitesStepProps) {
  const [isAddingRoom, setIsAddingRoom] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [currentRoom, setCurrentRoom] = useState<Partial<IRoomSuite>>({
    name: "",
    size: "",
    sizeNumeric: 0,
    description: "",
    features: [],
    count: 1
  })

  const roomsSuites = formData.roomsSuites || []

  // Handle adding/editing room
  const handleSaveRoom = () => {
    if (!currentRoom.name?.trim() || !currentRoom.size?.trim() || !currentRoom.description?.trim()) {
      return
    }

    const roomData: IRoomSuite = {
      name: currentRoom.name!,
      size: currentRoom.size!,
      sizeNumeric: currentRoom.sizeNumeric || 0,
      description: currentRoom.description!,
      features: currentRoom.features || [],
      count: currentRoom.count || 1
    }

    let updatedRooms = [...roomsSuites]
    
    if (editingIndex !== null) {
      updatedRooms[editingIndex] = roomData
    } else {
      updatedRooms.push(roomData)
    }

    onInputChange('roomsSuites', updatedRooms)
    resetForm()
  }

  const resetForm = () => {
    setCurrentRoom({
      name: "",
      size: "",
      sizeNumeric: 0,
      description: "",
      features: [],
      count: 1
    })
    setIsAddingRoom(false)
    setEditingIndex(null)
  }

  const handleEditRoom = (index: number) => {
    setCurrentRoom(roomsSuites[index])
    setEditingIndex(index)
    setIsAddingRoom(true)
  }

  const handleDeleteRoom = (index: number) => {
    const updatedRooms = roomsSuites.filter((_, i) => i !== index)
    onInputChange('roomsSuites', updatedRooms)
  }

  const handleFeatureToggle = (featureKey: string, checked: boolean) => {
    const currentFeatures = currentRoom.features || []
    let updatedFeatures: string[]
    
    if (checked) {
      updatedFeatures = [...currentFeatures, featureKey]
    } else {
      updatedFeatures = currentFeatures.filter(f => f !== featureKey)
    }
    
    setCurrentRoom(prev => ({ ...prev, features: updatedFeatures }))
  }

  return (
    <div className="space-y-6">
      {/* Room/Suite List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bed className="h-5 w-5" />
              Room & Suite Types ({roomsSuites.length})
            </CardTitle>
            <Button onClick={() => setIsAddingRoom(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Room Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {roomsSuites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bed className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No room types added yet</p>
              <p className="text-sm">Add at least one room or suite type to continue</p>
            </div>
          ) : (
            <div className="space-y-4">
              {roomsSuites.map((room, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{room.name}</h3>
                        <Badge variant="outline">{room.size}</Badge>
                        <Badge variant="secondary">{room.count} rooms</Badge>
                      </div>
                      <p className="text-gray-600 mb-3 text-sm">{room.description}</p>
                      
                      {room.features && room.features.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {room.features.map(feature => {
                            const featureInfo = roomFeatures[feature as keyof typeof roomFeatures]
                            if (!featureInfo) return null
                            const Icon = featureInfo.icon
                            return (
                              <Badge key={feature} variant="outline" className="text-xs">
                                <Icon className="h-3 w-3 mr-1" />
                                {featureInfo.label}
                              </Badge>
                            )
                          })}
                        </div>
                      )}
                      
                      {room.priceRange && (
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>💰 {room.priceRange.currency} {room.priceRange.min} - {room.priceRange.max}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRoom(index)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRoom(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Room Form */}
      {isAddingRoom && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingIndex !== null ? 'Edit Room Type' : 'Add New Room Type'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ValidatedInput
                label="Room/Suite Name"
                field="currentRoom.name"
                value={currentRoom.name || ""}
                onChange={(value) => setCurrentRoom(prev => ({ ...prev, name: value }))}
                formData={formData}
                errors={errors}
                setErrors={setErrors}
                placeholder="Standard Room"
                required
                maxLength={100}
                description="Name of the room or suite type"
              />
              
              <ValidatedInput
                label="Size (Display)"
                field="currentRoom.size"
                value={currentRoom.size || ""}
                onChange={(value) => setCurrentRoom(prev => ({ ...prev, size: value }))}
                formData={formData}
                errors={errors}
                setErrors={setErrors}
                placeholder="45 sqm"
                required
                maxLength={20}
                description="Size display format (e.g., '45 sqm')"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ValidatedInput
                label="Size (Numeric)"
                field="currentRoom.sizeNumeric"
                value={currentRoom.sizeNumeric || 0}
                onChange={(value) => setCurrentRoom(prev => ({ ...prev, sizeNumeric: Number(value) }))}
                formData={formData}
                errors={errors}
                setErrors={setErrors}
                type="number"
                placeholder="45"
                min={0}
                description="Numeric size value in sqm"
              />
              
              <ValidatedInput
                label="Number of Rooms"
                field="currentRoom.count"
                value={currentRoom.count || 1}
                onChange={(value) => setCurrentRoom(prev => ({ ...prev, count: Number(value) }))}
                formData={formData}
                errors={errors}
                setErrors={setErrors}
                type="number"
                placeholder="10"
                min={1}
                required
                description="How many rooms of this type"
              />
            </div>


            <ValidatedTextarea
              label="Description"
              field="currentRoom.description"
              value={currentRoom.description || ""}
              onChange={(value) => setCurrentRoom(prev => ({ ...prev, description: value }))}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              placeholder="Describe the room/suite features and amenities"
              required
              rows={3}
              maxLength={500}
              description="Detailed description of the room or suite"
            />

            {/* Room Features */}
            <div className="space-y-3">
              <Label>Room Features & Amenities</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(roomFeatures).map(([key, feature]) => {
                  const Icon = feature.icon
                  const isChecked = (currentRoom.features || []).includes(key)
                  
                  return (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`feature-${key}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => handleFeatureToggle(key, !!checked)}
                      />
                      <Label 
                        htmlFor={`feature-${key}`} 
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <Icon className="h-4 w-4" />
                        {feature.label}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Button onClick={handleSaveRoom}>
                {editingIndex !== null ? 'Update Room Type' : 'Add Room Type'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Status */}
      {roomsSuites.length === 0 && (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>At least one room or suite type is required to continue.</span>
        </div>
      )}
    </div>
  )
}