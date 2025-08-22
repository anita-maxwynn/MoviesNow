import { useState } from "react"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, LogOut, User } from "lucide-react"

import { Link } from "react-router-dom"
import { ThemeToggle } from "./ThemeToogle"
import { useAuth } from "@/providers/AuthProvider"

export function NavigationMenuDemo() {
  const [isOpen, setIsOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    setIsOpen(false)
  }

  const MobileNavItem = ({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) => (
    <Link
      to={to}
      className="block px-4 py-3 text-lg font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
      onClick={() => {
        setIsOpen(false)
        onClick?.()
      }}
    >
      {children}
    </Link>
  )

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-7xl px-4">
      <div className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-lg p-2 w-full">
        {/* Logo/Brand */}
        <div className="flex items-center">
          <Link
            to="/"
            className="flex items-center space-x-2 font-bold text-lg sm:text-xl text-gray-800 dark:text-white px-2 sm:px-4"
          >
            <span className="truncate">YourBrand</span>
          </Link>
        </div>

        {/* Desktop Navigation Menu */}
        <div className="hidden lg:block">
          <NavigationMenu>
            <NavigationMenuList className="gap-2">
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/" className="hover:text-blue-600 transition-colors px-3 py-2 rounded-md">
                    Home
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/about" className="hover:text-blue-600 transition-colors px-3 py-2 rounded-md">
                    About
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Dropdown List */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="px-3 py-2">Meets</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <Link
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                          to="/meets/create"
                        >
                          <div className="mb-2 mt-4 text-lg font-medium">
                            Create Meeting
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            Create Meeting using livekit.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link to="/meets" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">All Meets</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            List all your meetings.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/movies" className="hover:text-blue-600 transition-colors px-3 py-2 rounded-md">
                    Movies
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/contact" className="hover:text-blue-600 transition-colors px-3 py-2 rounded-md">
                    Contact
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Authentication Section */}
              {isAuthenticated ? (
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="px-3 py-2">
                    <User className="w-4 h-4 mr-2" />
                    {user?.email || 'User'}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[200px] gap-2 p-4">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            to="/profile"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">Profile</div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none flex items-center">
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                          </div>
                        </button>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ) : (
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      to="/login"
                      className="hover:text-blue-600 transition-colors px-3 py-2 rounded-md"
                    >
                      Login / SignIn
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right side items */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-800 dark:text-white hover:bg-white/20"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                <SheetHeader className="text-left">
                  <SheetTitle>Navigation</SheetTitle>
                  <SheetDescription>
                    Access all sections of the website
                  </SheetDescription>
                </SheetHeader>
                <nav className="flex flex-col gap-3 mt-6">
                  <MobileNavItem to="/">Home</MobileNavItem>
                  <MobileNavItem to="/about">About</MobileNavItem>
                  
                  {/* Mobile Meets Section */}
                  <div className="space-y-2">
                    <div className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Meetings
                    </div>
                    <div className="pl-4 space-y-2">
                      <MobileNavItem to="/meets/create">Create Meeting</MobileNavItem>
                      <MobileNavItem to="/meets">All Meets</MobileNavItem>
                    </div>
                  </div>
                  
                  <MobileNavItem to="/movies">Movies</MobileNavItem>
                  <MobileNavItem to="/contact">Contact</MobileNavItem>
                  
                  {/* Authentication Section for Mobile */}
                  {isAuthenticated ? (
                    <div className="space-y-2 border-t pt-4 mt-4">
                      <div className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        {user?.email || 'User'}
                      </div>
                      <MobileNavItem to="/profile">Profile</MobileNavItem>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center px-4 py-3 text-lg font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  ) : (
                    <MobileNavItem to="/login">Login / SignIn</MobileNavItem>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  )
}
