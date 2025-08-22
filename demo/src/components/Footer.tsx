import { Link } from 'react-router-dom'
import { Separator } from '@/components/ui/separator'
import { Github, Twitter, Mail, Heart, Film, Users, Calendar } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const footerSections = [
    {
      title: "Platform",
      links: [
        { name: "Movies", to: "/movies" },
        { name: "Meetings", to: "/meets" },
        { name: "Create Meet", to: "/meets/create" },
        { name: "About Us", to: "/about" }
      ]
    },
    {
      title: "Account",
      links: [
        { name: "Sign Up", to: "/signup" },
        { name: "Sign In", to: "/login" },
        { name: "Profile", to: "/profile" }
      ]
    },
    {
      title: "Support",
      links: [
        { name: "Help Center", to: "/help" },
        { name: "Community", to: "/community" },
        { name: "Privacy Policy", to: "/privacy" },
        { name: "Terms of Service", to: "/terms" }
      ]
    }
  ]

  const socialLinks = [
    { name: "GitHub", icon: <Github className="w-5 h-5" />, href: "https://github.com" },
    { name: "Twitter", icon: <Twitter className="w-5 h-5" />, href: "https://twitter.com" },
    { name: "Email", icon: <Mail className="w-5 h-5" />, href: "mailto:contact@moviesnow.com" }
  ]

  const features = [
    { icon: <Film className="w-5 h-5" />, text: "Synchronized Streaming" },
    { icon: <Users className="w-5 h-5" />, text: "Video Meetings" },
    { icon: <Calendar className="w-5 h-5" />, text: "Event Scheduling" }
  ]

  return (
    <footer className="bg-slate-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Film className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">MoviesNow</span>
            </Link>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Bringing people together through shared entertainment experiences and seamless communication.
            </p>
            
            {/* Features */}
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 text-sm text-gray-300">
                  <div className="text-blue-400">
                    {feature.icon}
                  </div>
                  {feature.text}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Sections */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link 
                      to={link.to} 
                      className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8 bg-gray-800" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Copyright */}
          <div className="flex items-center space-x-2 text-gray-400 text-sm">
            <span>&copy; {currentYear} MoviesNow. All rights reserved.</span>
            <Heart className="w-4 h-4 text-red-400" />
            <span>Made with love</span>
          </div>

          {/* Social Links */}
          <div className="flex space-x-4">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-200 p-2 rounded-lg hover:bg-gray-800"
                aria-label={social.name}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 space-y-2 sm:space-y-0">
            <div className="flex space-x-4">
              <Link to="/privacy" className="hover:text-gray-400 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-gray-400 transition-colors">
                Terms of Service
              </Link>
              <Link to="/cookies" className="hover:text-gray-400 transition-colors">
                Cookie Policy
              </Link>
            </div>
            <div>
              Version 1.0.0 - Built with React & Django
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
