"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Briefcase, MapPin, Calendar, Search, LogOut, User } from "lucide-react"

interface Job {
  id: string
  title: string
  company: string
  location: string
  description: string
  postedAt: string
  type: string
  salary?: string
}

export default function JobsPage() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("all") // Updated default value to 'all'

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    // Mock job data - in real app, fetch from API
    const mockJobs: Job[] = [
      {
        id: "1",
        title: "Senior React Developer",
        company: "TechCorp Inc.",
        location: "San Francisco, CA",
        description: "We are looking for an experienced React developer to join our team...",
        postedAt: "2024-01-15",
        type: "Full-time",
        salary: "$120k - $150k",
      },
      {
        id: "2",
        title: "Full Stack Engineer",
        company: "StartupXYZ",
        location: "Remote",
        description: "Join our fast-growing startup as a full stack engineer...",
        postedAt: "2024-01-14",
        type: "Full-time",
        salary: "$90k - $120k",
      },
      {
        id: "3",
        title: "Frontend Developer",
        company: "Design Studio",
        location: "New York, NY",
        description: "Creative frontend developer needed for innovative projects...",
        postedAt: "2024-01-13",
        type: "Contract",
        salary: "$80k - $100k",
      },
      {
        id: "4",
        title: "DevOps Engineer",
        company: "CloudTech",
        location: "Austin, TX",
        description: "Experienced DevOps engineer to manage our cloud infrastructure...",
        postedAt: "2024-01-12",
        type: "Full-time",
        salary: "$110k - $140k",
      },
      {
        id: "5",
        title: "Mobile App Developer",
        company: "MobileFirst",
        location: "Los Angeles, CA",
        description: "React Native developer for cross-platform mobile applications...",
        postedAt: "2024-01-11",
        type: "Part-time",
        salary: "$70k - $90k",
      },
    ]
    setJobs(mockJobs)
    setFilteredJobs(mockJobs)
  }, [])

  useEffect(() => {
    let filtered = jobs

    if (searchTerm) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.company.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (locationFilter) {
      filtered = filtered.filter((job) => job.location.toLowerCase().includes(locationFilter.toLowerCase()))
    }

    if (typeFilter !== "all") {
      // Updated condition to filter by type
      filtered = filtered.filter((job) => job.type === typeFilter)
    }

    setFilteredJobs(filtered)
  }, [searchTerm, locationFilter, typeFilter, jobs])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">DevBoard</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-sm text-gray-600">{user.name}</span>
              </div>
              {user.role === "admin" && (
                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                  Dashboard
                </Button>
              )}
              <Button variant="ghost" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Next Job</h1>
          <p className="text-gray-600">Discover opportunities that match your skills</p>
        </div>

        {/* Filters */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search jobs or companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Input placeholder="Location" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem> // Updated value prop to 'all'
              <SelectItem value="Full-time">Full-time</SelectItem>
              <SelectItem value="Part-time">Part-time</SelectItem>
              <SelectItem value="Contract">Contract</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("")
              setLocationFilter("")
              setTypeFilter("all") // Updated default value to 'all'
            }}
          >
            Clear Filters
          </Button>
        </div>

        {/* Job Listings */}
        <div className="space-y-6">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <CardDescription className="text-lg font-medium text-blue-600">{job.company}</CardDescription>
                  </div>
                  <Badge variant="secondary">{job.type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {job.location}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(job.postedAt).toLocaleDateString()}
                  </div>
                  {job.salary && <div className="font-medium text-green-600">{job.salary}</div>}
                </div>
                <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>
                <div className="flex space-x-2">
                  <Button onClick={() => router.push(`/jobs/${job.id}`)}>View Details</Button>
                  <Button variant="outline">Save Job</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        )}
      </main>
    </div>
  )
}
