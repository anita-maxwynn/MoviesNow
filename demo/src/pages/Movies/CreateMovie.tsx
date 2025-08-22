// src/pages/movies.tsx
import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { moviesAPI } from "@/lib/api"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

export default function CreateMovie() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    genre: "",
    release_year: new Date().getFullYear(),
    duration_minutes: 0,
    is_active: true
  })
  const [movieFile, setMovieFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description || !formData.genre || formData.duration_minutes <= 0) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!movieFile) {
      toast.error("Please select a movie file")
      return
    }

    setLoading(true)
    try {
      const movieData = {
        ...formData,
        movie_file: movieFile,
        thumbnail: thumbnailFile || undefined
      }

      await moviesAPI.createMovie(movieData)
      toast.success("Movie created successfully!")
      navigate("/movies")
    } catch (error: any) {
      console.error("Error creating movie:", error)
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || "Failed to create movie"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('/background.jpg')] bg-cover bg-center">
      <Card className="w-full max-w-2xl backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">Add Movie</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white">Title *</Label>
              <Input 
                id="title" 
                placeholder="Enter movie title" 
                className="bg-white/20 text-white placeholder:text-gray-300"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">Description *</Label>
              <Textarea 
                id="description" 
                placeholder="Write a short description" 
                className="bg-white/20 text-white placeholder:text-gray-300"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                required
              />
            </div>

            {/* Movie file */}
            <div className="space-y-2">
              <Label htmlFor="movieFile" className="text-white">Movie File *</Label>
              <Input 
                id="movieFile" 
                type="file" 
                accept="video/*"
                className="bg-white/20 text-white file:text-white file:bg-black/30"
                onChange={(e) => setMovieFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            {/* Thumbnail */}
            <div className="space-y-2">
              <Label htmlFor="thumbnail" className="text-white">Thumbnail</Label>
              <Input 
                id="thumbnail" 
                type="file" 
                accept="image/*"
                className="bg-white/20 text-white file:text-white file:bg-black/30"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-white">Duration (minutes) *</Label>
              <Input 
                id="duration" 
                type="number"
                min="1"
                placeholder="120" 
                className="bg-white/20 text-white placeholder:text-gray-300"
                value={formData.duration_minutes || ''}
                onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 0)}
                required
              />
            </div>

            {/* Genre */}
            <div className="space-y-2">
              <Label htmlFor="genre" className="text-white">Genre *</Label>
              <Input 
                id="genre" 
                placeholder="Action, Drama, Sci-Fi" 
                className="bg-white/20 text-white placeholder:text-gray-300"
                value={formData.genre}
                onChange={(e) => handleInputChange('genre', e.target.value)}
                required
              />
            </div>

            {/* Release Year */}
            <div className="space-y-2">
              <Label htmlFor="releaseYear" className="text-white">Release Year *</Label>
              <Input 
                id="releaseYear" 
                type="number"
                min="1900"
                max={new Date().getFullYear() + 10}
                placeholder="2024" 
                className="bg-white/20 text-white placeholder:text-gray-300"
                value={formData.release_year || ''}
                onChange={(e) => handleInputChange('release_year', parseInt(e.target.value) || new Date().getFullYear())}
                required
              />
            </div>

            {/* Is Active */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isActive" 
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked as boolean)}
              />
              <Label htmlFor="isActive" className="text-white">Make movie public</Label>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
              disabled={loading}
            >
              {loading ? "Creating..." : "Add Movie"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
