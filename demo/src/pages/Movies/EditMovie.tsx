// src/pages/EditMovie.tsx
import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useParams, useNavigate } from "react-router-dom"
import { moviesAPI } from "@/lib/api"
import { toast } from "sonner"

interface Movie {
  id: string
  title: string
  description: string
  genre: string
  release_year: number
  thumbnail?: string
  movie_file: string
  duration_minutes: number
  is_active: boolean
  created_at: string
  conversion_status: 'pending' | 'processing' | 'completed' | 'failed'
  hls_path?: string
  rating: number
}

export default function EditMovie() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
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

  useEffect(() => {
    if (!id) return

    const fetchMovie = async () => {
      try {
        const response = await moviesAPI.getMovie(id)
        const movieData = response.data
        setMovie(movieData)
        setFormData({
          title: movieData.title,
          description: movieData.description,
          genre: movieData.genre,
          release_year: movieData.release_year,
          duration_minutes: movieData.duration_minutes,
          is_active: movieData.is_active
        })
      } catch (error) {
        console.error('Failed to fetch movie:', error)
        toast.error('Failed to load movie')
        navigate('/movies')
      } finally {
        setLoading(false)
      }
    }

    fetchMovie()
  }, [id, navigate])

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!id) return

    if (!formData.title || !formData.description || !formData.genre || formData.duration_minutes <= 0) {
      toast.error("Please fill in all required fields")
      return
    }

    setSaving(true)
    try {
      const updateData: any = {
        ...formData
      }

      if (movieFile) {
        updateData.movie_file = movieFile
      }
      if (thumbnailFile) {
        updateData.thumbnail = thumbnailFile
      }

      await moviesAPI.updateMovie(id, updateData)
      toast.success("Movie updated successfully!")
      navigate('/movies')
    } catch (error: any) {
      console.error("Error updating movie:", error)
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || "Failed to update movie"
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return

    if (!window.confirm("Are you sure you want to delete this movie? This action cannot be undone.")) {
      return
    }

    setDeleting(true)
    try {
      await moviesAPI.deleteMovie(id)
      toast.success("Movie deleted successfully!")
      navigate('/movies')
    } catch (error: any) {
      console.error("Error deleting movie:", error)
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || "Failed to delete movie"
      toast.error(errorMessage)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-white">Loading movie...</div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-white">Movie not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('/background.jpg')] bg-cover bg-center p-4">
      <Card className="w-full max-w-2xl backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">Edit Movie</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-6">
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

            {/* Current movie file info */}
            <div className="space-y-2">
              <Label className="text-white">Current Movie File</Label>
              <div className="text-white/70 text-sm">
                {movie.movie_file ? `File: ${movie.movie_file.split('/').pop()}` : 'No file uploaded'}
              </div>
            </div>

            {/* Replace movie file */}
            <div className="space-y-2">
              <Label htmlFor="movieFile" className="text-white">Replace Movie File (optional)</Label>
              <Input 
                id="movieFile" 
                type="file" 
                accept="video/*"
                className="bg-white/20 text-white file:text-white file:bg-black/30"
                onChange={(e) => setMovieFile(e.target.files?.[0] || null)}
              />
            </div>

            {/* Current thumbnail info */}
            <div className="space-y-2">
              <Label className="text-white">Current Thumbnail</Label>
              {movie.thumbnail ? (
                <img 
                  src={`http://localhost:8000${movie.thumbnail}`} 
                  alt="Current thumbnail" 
                  className="w-32 h-20 object-cover rounded"
                />
              ) : (
                <div className="text-white/70 text-sm">No thumbnail uploaded</div>
              )}
            </div>

            {/* Replace thumbnail */}
            <div className="space-y-2">
              <Label htmlFor="thumbnail" className="text-white">Replace Thumbnail (optional)</Label>
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

            {/* Movie Status */}
            <div className="space-y-2">
              <Label className="text-white">Conversion Status</Label>
              <div className={`text-sm px-2 py-1 rounded ${
                movie.conversion_status === 'completed' ? 'bg-green-500/20 text-green-300' :
                movie.conversion_status === 'processing' ? 'bg-yellow-500/20 text-yellow-300' :
                movie.conversion_status === 'failed' ? 'bg-red-500/20 text-red-300' :
                'bg-gray-500/20 text-gray-300'
              }`}>
                {movie.conversion_status.charAt(0).toUpperCase() + movie.conversion_status.slice(1)}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
                disabled={saving}
              >
                {saving ? "Updating..." : "Update Movie"}
              </Button>
              
              <Button 
                type="button"
                variant="destructive" 
                className="flex-1"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Movie"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
