"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Briefcase, MapPin, Calendar, ArrowLeft } from "lucide-react"

interface Job {
  id: string
  title: string
  company: string
  location: string
  description: string
  requirements: string[]
  postedAt: string
  type: string
  salary?: string
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [job, setJob] = useState<Job | null>(null)
  const [showApplication, setShowApplication] = useState(false)
  const [coverLetter, setCoverLetter] = useState("")
  const [resume, setResume] = useState<File | null>(null)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    // Mock job data - in real app, fetch from API
    const mockJob: Job = {
      id: params.id,
      title: "Senior React Developer",
      company: "TechCorp Inc.",
      location: "San Francisco, CA",
      description: `We are looking for an experienced React developer to join our growing team. You will be responsible for building and maintaining high-quality web applications using modern React patterns and best practices.

Key Responsibilities:
• Develop and maintain React applications
• Collaborate with design and backend teams
• Write clean, maintainable code
• Participate in code reviews
• Mentor junior developers`,
      requirements: [
        "5+ years of React experience",
        "Strong JavaScript/TypeScript skills",
        "Experience with Redux or similar state management",
        "Knowledge of modern build tools",
        "Experience with testing frameworks",
        "Strong communication skills",
      ],
      postedAt: "2024-01-15",
      type: "Full-time",
      salary: "$120k - $150k",
    }
    setJob(mockJob)
  }, [params.id])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResume(e.target.files[0])
    }
  }

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resume) {
      toast({
        title: "Resume required",
        description: "Please upload your resume",
        variant: "destructive",
      })
      return
    }

    setApplying(true)

    // Mock application submission
    setTimeout(() => {
      toast({
        title: "Application submitted!",
        description: "We'll review your application and get back to you soon.",
      })
      setApplying(false)
      setShowApplication(false)
    }, 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !job) {
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
            <Button variant="ghost" onClick={() => router.push("/jobs")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl mb-2">{job.title}</CardTitle>
                <CardDescription className="text-xl font-medium text-blue-600 mb-4">{job.company}</CardDescription>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {job.location}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Posted {new Date(job.postedAt).toLocaleDateString()}
                  </div>
                  <Badge variant="secondary">{job.type}</Badge>
                </div>
              </div>
              {job.salary && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{job.salary}</div>
                  <div className="text-sm text-gray-600">per year</div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Job Description</h3>
              <div className="prose max-w-none">
                {job.description.split("\n").map((paragraph, index) => (
                  <p key={index} className="mb-3 text-gray-700">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Requirements</h3>
              <ul className="space-y-2">
                {job.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span className="text-gray-700">{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex space-x-4 pt-6 border-t">
              {!showApplication ? (
                <>
                  <Button onClick={() => setShowApplication(true)} size="lg">
                    Apply Now
                  </Button>
                  <Button variant="outline" size="lg">
                    Save Job
                  </Button>
                </>
              ) : (
                <div className="w-full">
                  <h3 className="text-lg font-semibold mb-4">Apply for this position</h3>
                  <form onSubmit={handleApply} className="space-y-4">
                    <div>
                      <Label htmlFor="resume">Resume *</Label>
                      <div className="mt-1">
                        <Input id="resume" type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} required />
                        <p className="text-sm text-gray-600 mt-1">Upload your resume (PDF, DOC, or DOCX)</p>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="coverLetter">Cover Letter</Label>
                      <Textarea
                        id="coverLetter"
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        placeholder="Tell us why you're interested in this position..."
                        rows={6}
                      />
                    </div>
                    <div className="flex space-x-4">
                      <Button type="submit" disabled={applying}>
                        {applying ? "Submitting..." : "Submit Application"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowApplication(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
