// components/ui/data-page-layout.tsx
"use client"

import { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, LucideIcon } from "lucide-react"

// Types for the layout component
export interface StatCard {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  isLoading?: boolean
}

export interface FilterConfig {
  label: string
  value: string
  placeholder: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}

export interface DataPageLayoutProps {
  // Header section
  title: string
  subtitle: string
  primaryAction: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  
  // Stats section
  stats: StatCard[]
  
  // Filters section
  searchConfig: {
    placeholder: string
    value: string
    onChange: (value: string) => void
    onSearch: () => void
  }
  filters: FilterConfig[]
  onClearFilters: () => void
  
  // Content section
  children: ReactNode
  
  // Optional customization
  className?: string
}

export function DataPageLayout({
  title,
  subtitle,
  primaryAction,
  stats,
  searchConfig,
  filters,
  onClearFilters,
  children,
  className = ""
}: DataPageLayoutProps) {
  const PrimaryIcon = primaryAction.icon || Plus

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-2">
            {subtitle}
          </p>
        </div>
        <Button 
          onClick={primaryAction.onClick} 
          size="lg"
          className="w-full sm:w-auto"
        >
          <PrimaryIcon className="mr-2 h-4 w-4" />
          {primaryAction.label}
        </Button>
      </div>

      {/* Summary Stats Section */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.isLoading ? (
                  <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
                ) : (
                  stat.value
                )}
              </div>
              {stat.description && (
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={searchConfig.placeholder}
                  value={searchConfig.value}
                  onChange={(e) => searchConfig.onChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchConfig.onSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filter Selects - Responsive Grid */}
            <div className="flex flex-col sm:flex-row gap-2 sm:flex-wrap lg:flex-nowrap">
              {filters.map((filter) => (
                <Select 
                  key={filter.label}
                  value={filter.value} 
                  onValueChange={filter.onChange}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder={filter.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:w-auto">
              <Button 
                onClick={searchConfig.onSearch}
                className="w-full sm:w-auto"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button 
                variant="outline" 
                onClick={onClearFilters}
                className="w-full sm:w-auto"
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Section */}
      <div className="w-full">
        {children}
      </div>
    </div>
  )
}