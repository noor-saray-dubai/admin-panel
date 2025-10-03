// components/project/DeveloperSearch.tsx
"use client"

import { useState, useMemo, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, X, AlertCircle, CheckCircle } from "lucide-react"

interface Developer {
  id: string
  name: string
  slug?: string
}

interface DeveloperSearchProps {
  value: string
  onChange: (developer: Developer) => void
  error?: string
  onBlur?: () => void
}

export function DeveloperSearch({ 
  value, 
  onChange, 
  error,
  onBlur 
}: DeveloperSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch developers from API
  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const res = await fetch("/api/developers/fetch")
        const json = await res.json()
        if (json.success) {
          setDevelopers(json.data)
        }
      } catch (err) {
        console.error("Error fetching developers:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchDevelopers()
  }, [])

  const filteredDevelopers = useMemo(() => {
    if (!searchTerm.trim()) return developers
    return developers.filter(dev => 
      dev.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [developers, searchTerm])

  const selectedDeveloper = developers.find(dev => dev.name === value)
  const hasValue = selectedDeveloper && selectedDeveloper.name

  return (
    <div className="relative">
      <Label className={`flex items-center gap-1 ${hasValue ? 'text-green-600' : ''}`}>
        {hasValue && <CheckCircle className="h-3 w-3" />}
        Developer <span className="text-red-500">*</span>
      </Label>
      <div className="relative mt-1">
        <div className="flex">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => {
              setTimeout(() => setIsOpen(false), 200)
              if (onBlur) onBlur()
            }}
            placeholder={loading ? "Loading developers..." : "Search developers..."}
            disabled={loading}
            className={`pr-10 ${error ? 'border-red-500' : hasValue ? 'border-green-500' : ''} ${!hasValue ? 'bg-red-50 border-red-200' : ''}`}
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        
        {isOpen && filteredDevelopers.length > 0 && !loading && (
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

        {isOpen && filteredDevelopers.length === 0 && !loading && searchTerm && (
          <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 p-3 text-center text-gray-500">
            No developers found matching "{searchTerm}"
          </div>
        )}
      </div>
      
      {selectedDeveloper && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded flex justify-between items-center">
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
        <span className="text-red-500 text-xs flex items-center gap-1 mt-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </span>
      )}
    </div>
  )
}