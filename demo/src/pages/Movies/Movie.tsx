// src/pages/movie-details.tsx
import { useEffect, useRef, useState } from "react"
import { Star } from "lucide-react"
import Hls from "hls.js"
import { useParams, useNavigate } from "react-router-dom"
import { moviesAPI, reviewsAPI } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/providers/AuthProvider"

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

interface Review {
  id: string
  movie: string
  user: string
  user_name: string
  user_email: string
  rating: number
  comment: string
}

export default function MovieDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  
  const [movie, setMovie] = useState<Movie | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [newRating, setNewRating] = useState(0)
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    if (!id) return

    const fetchMovie = async () => {
      try {
        const response = await moviesAPI.getMovie(id)
        setMovie(response.data)
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

  useEffect(() => {
    if (!id) return

    const fetchReviews = async () => {
      setReviewsLoading(true)
      try {
        const response = await reviewsAPI.getReviews(id)
        setReviews(response.data.results || response.data)
      } catch (error) {
        console.error('Failed to fetch reviews:', error)
      } finally {
        setReviewsLoading(false)
      }
    }

    fetchReviews()
  }, [id])

  useEffect(() => {
    if (movie && videoRef.current) {
      let videoUrl = ""
      
      // Prefer HLS stream if available and conversion is completed
      if (movie.hls_path && movie.conversion_status === 'completed') {
        // hls_path should now be a proper relative URL from the backend
        videoUrl = `http://localhost:8000${movie.hls_path}`
      } else {
        // Fallback to original movie file (already has full URL)
        videoUrl = movie.movie_file
      }

      if (videoRef.current.canPlayType("application/vnd.apple.mpegurl") && movie.hls_path) {
        videoRef.current.src = videoUrl
      } else if (Hls.isSupported() && movie.hls_path) {
        const hls = new Hls()
        hls.loadSource(videoUrl)
        hls.attachMedia(videoRef.current)
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', event, data)
          // Fallback to original file
          if (videoRef.current) {
            videoRef.current.src = movie.movie_file
          }
        })
      } else {
        // Direct video file
        videoRef.current.src = videoUrl
      }
    }
  }, [movie])

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
    : 0

  const handleAddReview = async () => {
    console.log("Authentication status:", isAuthenticated)
    console.log("Access token:", localStorage.getItem('access_token'))
    
    if (!isAuthenticated) {
      toast.error("Please log in to add a review")
      return
    }

    if (!newComment.trim() || newRating === 0) {
      toast.error("Please provide both a comment and rating")
      return
    }

    if (!id) return

    setSubmittingReview(true)
    try {
      const reviewData = {
        movie: id,
        rating: newRating,
        comment: newComment
      }

      console.log("Submitting review:", reviewData)
      await reviewsAPI.createReview(reviewData)
      toast.success("Review added successfully!")
      
      // Refresh reviews
      const response = await reviewsAPI.getReviews(id)
      setReviews(response.data.results || response.data)
      
      // Reset form
      setNewComment("")
      setNewRating(0)
    } catch (error: any) {
      console.error('Failed to add review:', error)
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || "Failed to add review"
      toast.error(errorMessage)
    } finally {
      setSubmittingReview(false)
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
    <div className="min-h-screen bg-[url('/background.jpg')] bg-cover bg-center p-6">
      <div className="bg-black/70 p-6 rounded-2xl max-w-5xl mx-auto">
        {/* Movie Info */}
        <div className="flex flex-col md:flex-row gap-6">
          {movie.thumbnail ? (
            <img
              src={movie.thumbnail}
              alt={movie.title}
              className="w-40 md:w-56 rounded-xl shadow-lg object-cover"
            />
          ) : (
            <div className="w-40 md:w-56 h-60 bg-gray-800 rounded-xl shadow-lg flex items-center justify-center">
              <span className="text-white/50 text-sm">No thumbnail</span>
            </div>
          )}
          
          <div className="text-white flex-1">
            <h1 className="text-3xl font-bold">{movie.title}</h1>
            <p className="text-gray-300 mt-2">{movie.description}</p>
            <p className="mt-3 text-sm text-gray-400">
              <span className="font-semibold">Genre:</span> {movie.genre}
            </p>
            <p className="mt-1 text-sm text-gray-400">
              <span className="font-semibold">Release Year:</span> {movie.release_year}
            </p>
            <p className="mt-1 text-sm text-gray-400">
              <span className="font-semibold">Duration:</span> {movie.duration_minutes} minutes
            </p>
            <p className="mt-1 text-sm text-gray-400">
              <span className="font-semibold">Status:</span> 
              <span className={`ml-1 ${
                movie.conversion_status === 'completed' ? 'text-green-400' :
                movie.conversion_status === 'processing' ? 'text-yellow-400' :
                movie.conversion_status === 'failed' ? 'text-red-400' :
                'text-gray-400'
              }`}>
                {movie.conversion_status.charAt(0).toUpperCase() + movie.conversion_status.slice(1)}
              </span>
            </p>

            {/* Average Rating */}
            <div className="flex items-center mt-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i <= Math.round(averageRating)
                      ? "text-yellow-400"
                      : "text-gray-500"
                  }`}
                  fill={i <= Math.round(averageRating) ? "currentColor" : "none"}
                />
              ))}
              <span className="ml-2 text-sm text-gray-300">
                {averageRating.toFixed(1)}/5 ({reviews.length} reviews)
              </span>
            </div>
          </div>
        </div>

        {/* Video Player */}
        <div className="mt-8">
          <video
            ref={videoRef}
            controls
            className="w-full rounded-xl shadow-lg"
            poster={movie.thumbnail || undefined}
          />
          {movie.conversion_status === 'processing' && (
            <div className="mt-2 text-yellow-400 text-sm">
              ⚠️ Video is still being processed. Streaming quality may be limited.
            </div>
          )}
          {movie.conversion_status === 'failed' && (
            <div className="mt-2 text-red-400 text-sm">
              ❌ Video processing failed. Only original file available.
            </div>
          )}
        </div>

        {/* Comment Section */}
        <div className="mt-10 text-white">
          <h2 className="text-2xl font-semibold mb-4">Reviews</h2>

          {/* Review Form */}
          {isAuthenticated ? (
            <div className="bg-white/10 p-4 rounded-xl mb-6">
              <textarea
                className="w-full p-2 rounded-md bg-black/40 text-white border border-white/20 placeholder:text-gray-400"
                rows={3}
                placeholder="Write your review..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={submittingReview}
              />
              <div className="flex items-center mt-3 gap-2">
                <span className="text-sm text-gray-300">Rating:</span>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`w-6 h-6 cursor-pointer ${
                      i <= newRating ? "text-yellow-400" : "text-gray-500"
                    }`}
                    fill={i <= newRating ? "currentColor" : "none"}
                    onClick={() => !submittingReview && setNewRating(i)}
                  />
                ))}
                <button
                  onClick={handleAddReview}
                  className="ml-auto px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submittingReview || !newComment.trim() || newRating === 0}
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 p-4 rounded-xl mb-6 text-center">
              <p className="text-gray-300">Please log in to add a review</p>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {reviewsLoading ? (
              <div className="text-center text-gray-400">Loading reviews...</div>
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white/10 p-4 rounded-xl shadow-md"
                >
                  <div className="flex items-center mb-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i <= review.rating ? "text-yellow-400" : "text-gray-500"
                        }`}
                        fill={i <= review.rating ? "currentColor" : "none"}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-400">
                      by {review.user_name || review.user_email}
                    </span>
                  </div>
                  <p className="text-gray-200">{review.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-400">No reviews yet. Be the first!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
