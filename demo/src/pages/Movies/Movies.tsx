// src/pages/movies-list.tsx
import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { moviesAPI } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/providers/AuthProvider"
import { Edit, Trash2, Play } from "lucide-react"

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

export default function Movies() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingMovieId, setDeletingMovieId] = useState<string | null>(null)
  const { user } = useAuth()

  const isStaff = user?.is_staff || false

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await moviesAPI.getMovies()
        const data = response.data?.results || response.data || []
        setMovies(data)
      } catch (error) {
        console.error('Failed to fetch movies:', error)
        toast.error('Failed to load movies')
      } finally {
        setLoading(false)
      }
    }

    fetchMovies()
  }, [])

  const handleDeleteMovie = async (movieId: string, movieTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${movieTitle}"? This action cannot be undone.`)) {
      return
    }

    setDeletingMovieId(movieId)
    try {
      await moviesAPI.deleteMovie(movieId)
      toast.success("Movie deleted successfully!")
      // Remove the deleted movie from the state
      setMovies(prevMovies => prevMovies.filter(movie => movie.id !== movieId))
    } catch (error: any) {
      console.error('Failed to delete movie:', error)
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || "Failed to delete movie"
      toast.error(errorMessage)
    } finally {
      setDeletingMovieId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-white">Loading movies...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[url('/background.jpg')] bg-cover bg-center p-10">
      {/* Hero Heading */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-extrabold text-white drop-shadow-lg tracking-wide">
          🎬 Movie Library
        </h1>
        <p className="text-white/70 mt-2 text-lg">
          Explore and watch your favorite movies
        </p>
      </div>

      {/* Movies Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {movies.map((movie) => (
          <Card
            key={movie.id}
            className="group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 shadow-2xl rounded-2xl transform transition duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          >
            {/* Thumbnail */}
            <div className="aspect-video bg-gray-800 flex items-center justify-center">
              {movie.thumbnail ? (
                <img
                  src={`${movie.thumbnail}`}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="text-white/50 text-sm">No thumbnail available</div>
              )}
            </div>

            {/* Card Content */}
            <CardContent className="p-4 space-y-2">
              <h2 className="text-white font-bold text-lg truncate">
                {movie.title}
              </h2>
              <p className="text-white/70 text-sm leading-relaxed line-clamp-2">
                {movie.description}
              </p>
              <p className="text-white/90 text-sm leading-relaxed mb-3">
                <span className="font-semibold">Genre:</span> {movie.genre}
              </p>
              <p className="text-white/90 text-sm leading-relaxed">
                <span className="font-semibold">Year:</span> {movie.release_year}
              </p>
              <p className="text-white/90 text-sm leading-relaxed">
                <span className="font-semibold">Duration:</span> {movie.duration_minutes} min
              </p>
              <p className="text-white/90 text-sm leading-relaxed">
                <span className="font-semibold">Rating:</span> {(movie.rating ?? 0).toFixed(1)}/5.0
              </p>
            </CardContent>

            {/* Footer */}
            <CardFooter className="p-4 space-y-3">
              <Link to={`/movies/${movie.id}`} className="w-full">
                <Button className="w-full bg-white/20 text-white hover:bg-white/30 rounded-xl transition-all duration-300 flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Watch Now
                </Button>
              </Link>
              
              {/* Staff-only buttons */}
              {isStaff && (
                <div className="flex space-x-2 w-full">
                  <Link to={`/movies/${movie.id}/edit`} className="flex-1">
                    <Button 
                      variant="outline" 
                      className="w-full bg-blue-500/20 border-blue-500/50 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 rounded-xl transition-all duration-300 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="outline"
                    className="flex-1 bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30 hover:text-red-200 rounded-xl transition-all duration-300 flex items-center gap-2"
                    onClick={() => handleDeleteMovie(movie.id, movie.title)}
                    disabled={deletingMovieId === movie.id}
                  >
                    <Trash2 className="w-4 h-4" />
                    {deletingMovieId === movie.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
