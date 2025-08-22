import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, Users, Film, Calendar, ArrowRight, Star, Shield, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'

const HomePage = () => {
  const { isAuthenticated } = useAuth()

  const features = [
    {
      icon: <Film className="w-8 h-8 text-blue-500" />,
      title: "Stream Movies Together",
      description: "Watch your favorite movies simultaneously with friends and family in real-time synchronized viewing sessions."
    },
    {
      icon: <Users className="w-8 h-8 text-green-500" />,
      title: "Video Meetings",
      description: "Host high-quality video meetings with up to 50 participants using our integrated LiveKit technology."
    },
    {
      icon: <Calendar className="w-8 h-8 text-purple-500" />,
      title: "Scheduled Events",
      description: "Plan and schedule movie nights or meetings in advance with automatic notifications and reminders."
    },
    {
      icon: <Shield className="w-8 h-8 text-red-500" />,
      title: "Secure & Private",
      description: "Your sessions are encrypted and secure. Only invited participants can join your private rooms."
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-500" />,
      title: "Lightning Fast",
      description: "Experience minimal lag and high-quality streaming with our optimized infrastructure."
    },
    {
      icon: <Star className="w-8 h-8 text-indigo-500" />,
      title: "Premium Experience",
      description: "Enjoy ad-free viewing, HD quality, and premium features for an enhanced entertainment experience."
    }
  ]

  const stats = [
    { label: "Active Users", value: "10K+" },
    { label: "Movies Streamed", value: "50K+" },
    { label: "Meetings Hosted", value: "25K+" },
    { label: "Hours Watched", value: "100K+" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              🎬 Now in Beta - Join the Future of Entertainment
            </Badge>
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              Watch Together,
              <br />
              Meet Anywhere
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Experience the ultimate platform for synchronized movie streaming and seamless video meetings. 
              Connect with friends, family, and colleagues like never before.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              {isAuthenticated ? (
                <>
                  <Button asChild size="lg" className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl">
                    <Link to="/movies" className="flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Start Watching
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="px-8 py-6 text-lg font-semibold border-2">
                    <Link to="/meets/create" className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Create Meeting
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg" className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl">
                    <Link to="/signup" className="flex items-center gap-2">
                      Get Started Free
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="px-8 py-6 text-lg font-semibold border-2">
                    <Link to="/login">
                      Sign In
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Discover the features that make us the premier destination for shared entertainment and professional meetings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="h-full border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already enjoying synchronized entertainment and seamless meetings.
          </p>
          {!isAuthenticated && (
            <Button asChild size="lg" variant="secondary" className="px-8 py-6 text-lg font-semibold bg-white text-blue-600 hover:bg-gray-100">
              <Link to="/signup" className="flex items-center gap-2">
                Create Your Free Account
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          )}
        </div>
      </section>
    </div>
  )
}

export default HomePage