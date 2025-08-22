import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { User, Edit, Save, X, Eye, EyeOff, Calendar, Mail, Shield } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { authAPI } from '@/lib/api'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

interface UserProfile {
  id: string
  email: string
  name: string
  profile_picture?: string
  date_joined: string
}

const ProfilePage = () => {
  const { updateUser, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form states
  const [editForm, setEditForm] = useState({
    name: '',
    profile_picture: ''
  })
  
  // Password change states
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  })
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchProfile()
  }, [isAuthenticated, navigate])

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile()
      setProfile(response.data)
      setEditForm({
        name: response.data.name || '',
        profile_picture: response.data.profile_picture || ''
      })
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const response = await authAPI.updateProfile(editForm)
      setProfile(response.data)
      updateUser(response.data)
      setEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      const errorMessage = error.response?.data?.message || 'Failed to update profile'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditForm({
      name: profile?.name || '',
      profile_picture: profile?.profile_picture || ''
    })
    setEditing(false)
  }

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordForm.new_password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    setChangingPassword(true)
    try {
      await authAPI.changePassword(passwordForm)
      toast.success('Password changed successfully!')
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' })
      setPasswordDialogOpen(false)
    } catch (error: any) {
      console.error('Failed to change password:', error)
      const errorMessage = error.response?.data?.old_password?.[0] || 
                          error.response?.data?.new_password?.[0] || 
                          error.response?.data?.message || 
                          'Failed to change password'
      toast.error(errorMessage)
    } finally {
      setChangingPassword(false)
    }
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-300">Profile not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            My Profile
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <Card className="border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile Information
                  </CardTitle>
                  {!editing ? (
                    <Button
                      onClick={() => setEditing(true)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveProfile}
                        size="sm"
                        disabled={saving}
                        className="flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="outline"
                        size="sm"
                        disabled={saving}
                        className="flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={editing ? editForm.profile_picture : profile.profile_picture} />
                    <AvatarFallback className="text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      {getInitials(profile.name, profile.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {profile.name || 'No name set'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">{profile.email}</p>
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Display Name
                    </Label>
                    {editing ? (
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Enter your display name"
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-white">
                        {profile.name || 'Not set'}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email Address
                    </Label>
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-white flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      {profile.email}
                      <Badge variant="secondary" className="ml-auto">Verified</Badge>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="profile_picture" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Profile Picture URL
                    </Label>
                    {editing ? (
                      <Input
                        id="profile_picture"
                        value={editForm.profile_picture}
                        onChange={(e) => setEditForm({ ...editForm, profile_picture: e.target.value })}
                        placeholder="Enter image URL (optional)"
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-white">
                        {profile.profile_picture ? (
                          <a href={profile.profile_picture} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {profile.profile_picture}
                          </a>
                        ) : (
                          'Not set'
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Account Info */}
            <Card className="border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Member since</span>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                    <Calendar className="w-4 h-4" />
                    {formatDate(profile.date_joined)}
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Account Status</span>
                  <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Security Actions */}
            <Card className="border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                  Security
                </CardTitle>
                <CardDescription>
                  Manage your account security settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        Enter your current password and choose a new one.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="old_password">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="old_password"
                            type={showPasswords.old ? 'text' : 'password'}
                            value={passwordForm.old_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                            placeholder="Enter current password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                          >
                            {showPasswords.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="new_password">New Password</Label>
                        <div className="relative">
                          <Input
                            id="new_password"
                            type={showPasswords.new ? 'text' : 'password'}
                            value={passwordForm.new_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                            placeholder="Enter new password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          >
                            {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="confirm_password">Confirm New Password</Label>
                        <div className="relative">
                          <Input
                            id="confirm_password"
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={passwordForm.confirm_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                            placeholder="Confirm new password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          >
                            {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleChangePassword}
                          disabled={changingPassword || !passwordForm.old_password || !passwordForm.new_password || !passwordForm.confirm_password}
                          className="flex-1"
                        >
                          {changingPassword ? 'Changing...' : 'Change Password'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setPasswordForm({ old_password: '', new_password: '', confirm_password: '' })
                            setPasswordDialogOpen(false)
                          }}
                          disabled={changingPassword}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
