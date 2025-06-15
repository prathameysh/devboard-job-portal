"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Users, TrendingUp, Plus, LogOut, User, Eye, Edit, Trash2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface DashboardStats {
  totalJobs: number
  totalApplications: number
  activeJobs: number
  pendingApplications: number
}

interface Job {
  id: string
  title: string
  company: string
  applications: number
  status: "active" | "closed"
  postedAt: string
}

interface Application {
  id: string
  jobTitle: string
  applicantName: string
  applicantEmail: string
  status: "pending" | "reviewed" | "shortlisted" | "rejected"
  appliedAt: string
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

export default function DashboardPage() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    totalApplications: 0,
    activeJobs: 0,
    pendingApplications: 0,
  })
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Application[]>([])

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/jobs")
    }
  }, [user, loading, router])

  useEffect(() => {
    // Mock data - in real app, fetch from API
    const mockStats: DashboardStats = {
      totalJobs: 12,
      totalApplications: 89,
      activeJobs: 8,
      pendingApplications: 23,
    }

    const mockJobs: Job[] = [
      {
        id: "1",
        title: "Senior React Developer",
        company: "TechCorp Inc.",
        applications: 15,
        status: "active",
        postedAt: "2024-01-15",
      },
      {
        id: "2",
        title: "Full Stack Engineer",
        company: "StartupXYZ",
        applications: 8,
        status: "active",
        postedAt: "2024-01-14",
      },
      {
        id: "3",
        title: "Frontend Developer",
        company: "Design Studio",
        applications: 12,
        status: "closed",
        postedAt: "2024-01-13",
      },
    ]

    const mockApplications: Application[] = [
      {
        id: "1",
        jobTitle: "Senior React Developer",
        applicantName: "John Doe",
        applicantEmail: "john@example.com",
        status: "pending",
        appliedAt: "2024-01-16",
      },
      {
        id: "2",
        jobTitle: "Senior React Developer",
        applicantName: "Jane Smith",
        applicantEmail: "jane@example.com",
        status: "shortlisted",
        appliedAt: "2024-01-15",
      },
      {
        id: "3",
        jobTitle: "Full Stack Engineer",
        applicantName: "Bob Johnson",
        applicantEmail: "bob@example.com",
        status: "reviewed",
        appliedAt: "2024-01-14",
      },
    ]

    setStats(mockStats)
    setJobs(mockJobs)
    setApplications(mockApplications)
  }, [])

  const chartData = [
    { name: "Jan", applications: 12 },
    { name: "Feb", applications: 19 },
    { name: "Mar", applications: 15 },
    { name: "Apr", applications: 25 },
    { name: "May", applications: 22 },
    { name: "Jun", applications: 18 },
  ]

  const pieData = [
    { name: "Pending", value: 23, color: "#0088FE" },
    { name: "Reviewed", value: 15, color: "#00C49F" },
    { name: "Shortlisted", value: 8, color: "#FFBB28" },
    { name: "Rejected", value: 12, color: "#FF8042" },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "reviewed":
        return "bg-blue-100 text-blue-800"
      case "shortlisted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || user.role !== "admin") {
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
              <span className="ml-2 text-2xl font-bold text-gray-900">DevBoard Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-sm text-gray-600">{user.name}</span>
              </div>
              <Button onClick={() => router.push("/post-job")}>
                <Plus className="h-4 w-4 mr-2" />
                Post Job
              </Button>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Manage your job postings and applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalJobs}</div>
              <p className="text-xs text-muted-foreground">{stats.activeJobs} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApplications}</div>
              <p className="text-xs text-muted-foreground">{stats.pendingApplications} pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeJobs}</div>
              <p className="text-xs text-muted-foreground">+2 from last week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingApplications}</div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Applications Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="applications" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="jobs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="jobs">Job Postings</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Job Postings</CardTitle>
                <CardDescription>Manage your active and closed job postings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{job.title}</h3>
                        <p className="text-sm text-gray-600">{job.company}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge variant={job.status === "active" ? "default" : "secondary"}>{job.status}</Badge>
                          <span className="text-sm text-gray-600">{job.applications} applications</span>
                          <span className="text-sm text-gray-600">
                            Posted {new Date(job.postedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>Review and manage job applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{application.applicantName}</h3>
                        <p className="text-sm text-gray-600">{application.applicantEmail}</p>
                        <p className="text-sm text-gray-600">Applied for: {application.jobTitle}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge className={getStatusColor(application.status)}>{application.status}</Badge>
                          <span className="text-sm text-gray-600">
                            Applied {new Date(application.appliedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          View Resume
                        </Button>
                        <Button variant="outline" size="sm">
                          Update Status
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
