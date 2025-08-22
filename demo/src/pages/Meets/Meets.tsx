"use client"

import { useState, useEffect, Component, type ReactNode } from 'react'
import { meetsAPI } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'
import InviteUser from '@/components/InviteUser'
import Invitations from '@/components/Invitations'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

// Define the shape of meet data
export type Meet = {
  id: string
  name: string
  creator_email: string
  meet_datetime: string
  created_at: string
  invite_duration_minutes: number
  max_participants: number
  is_private: boolean
  movie_details?: {
    id: string
    title: string
    genre: string
  }
  is_active: boolean
  movie_started: boolean
}

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean}> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return <h2>Something went wrong with invitations. Please refresh the page.</h2>;
    }
    return this.props.children;
  }
}
// Define columns for the meets table
const createColumns = (user: any, navigate: any): ColumnDef<Meet>[] => [
  {
    accessorKey: "name",
    header: "Room Name",
  },
  {
    accessorKey: "movie_details",
    header: "Movie",
    cell: ({ row }) => {
      const movie = row.getValue("movie_details") as any
      return movie ? movie.title : "No movie selected"
    },
  },
  {
    accessorKey: "meet_datetime",
    header: "Scheduled Time",
    cell: ({ row }) => {
      const date = new Date(row.getValue("meet_datetime"))
      return date.toLocaleString()
    },
  },
  {
    accessorKey: "creator_email",
    header: "Created By",
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("is_active") as boolean
      const meet = row.original
      const now = new Date()
      const meetTime = new Date(meet.meet_datetime)
      
      let status = "scheduled"
      if (isActive && meetTime <= now) {
        status = "active"
      } else if (meetTime < now) {
        status = "ended"
      }
      
      const statusColors = {
        scheduled: "bg-blue-100 text-blue-800",
        active: "bg-green-100 text-green-800",
        ended: "bg-gray-100 text-gray-800"
      }
      
      return (
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          {meet.movie_started && (
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
              Movie Playing
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "max_participants",
    header: "Max Participants",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const meet = row.original
      const now = new Date()
      const meetTime = new Date(meet.meet_datetime)
      
      let status = "scheduled"
      if (meet.is_active && meetTime <= now) {
        status = "active"
      } else if (meetTime < now) {
        status = "ended"
      }
      
      const getButtonText = () => {
        if (status === "ended") return "Ended"
        return status === "active" ? "Join Now" : "Join"
      }
      
      const handleJoinMeet = (meetId: string) => {
        console.log(`Joining meet with ID: ${meetId}`)
        navigate(`/meet/${meetId}`)
      }
      
      return (
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => handleJoinMeet(meet.id)}
            disabled={status === "ended"}
            variant={status === "active" ? "default" : "outline"}
            size="sm"
          >
            {getButtonText()}
          </Button>
          {/* Show invite button only for room creators */}
          {user?.email === meet.creator_email && (
            <InviteUser roomId={meet.id} roomName={meet.name} />
          )}
        </div>
      )
    },
  },
]

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No meetings found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

// Main Meets component
export default function Meets() {
  const [meets, setMeets] = useState<Meet[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  const columns = createColumns(user, navigate)

  useEffect(() => {
    // Fetch meets from API
    const fetchMeets = async () => {
      try {
        const response = await meetsAPI.getRooms()
        const data = response.data.results || response.data
        setMeets(data)
      } catch (error) {
        console.error('Failed to fetch meets:', error)
        // Use mock data as fallback
        setMeets(mockMeets)
      } finally {
        setLoading(false)
      }
    }

    fetchMeets()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading meetings...</div>
      </div>
    )
  }

  // Group meetings by creator status
  const createdByMe = meets.filter(meet => meet.creator_email === user?.email)
  const gotInvited = meets.filter(meet => meet.creator_email !== user?.email)
  // console.log(meets)
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Meetings</h1>
          <p className="text-muted-foreground">
            View and join your meetings organized by type
          </p>
        </div>
        <Link to="/meets/create">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Meeting
          </Button>
        </Link>
      </div>

      {/* Invitations section */}
      <ErrorBoundary>
        <Invitations />
      </ErrorBoundary>

      {/* Created by myself section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-semibold text-primary">Created by Myself</h2>
          <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm font-medium">
            {createdByMe.length}
          </span>
        </div>
        {createdByMe.length > 0 ? (
          <DataTable columns={columns} data={createdByMe} />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>You haven't created any meetings yet.</p>
          </div>
        )}
      </div>

      {/* Got invited section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-semibold text-blue-600">Got Invited</h2>
          <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-sm font-medium">
            {gotInvited.length}
          </span>
        </div>
        {gotInvited.length > 0 ? (
          <DataTable columns={columns} data={gotInvited} />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>You don't have any meeting invitations.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Mock data for testing (remove when API is ready)
const mockMeets: Meet[] = [
  {
    id: "1",
    name: "Team Standup",
    creator_email: "john.doe@example.com",
    meet_datetime: "2025-08-21T10:00:00Z",
    created_at: "2025-08-20T10:00:00Z",
    invite_duration_minutes: 30,
    max_participants: 10,
    is_private: false,
    movie_details: {
      id: "1",
      title: "The Matrix",
      genre: "Action"
    },
    is_active: false,
    movie_started: false,
  },
  {
    id: "2",
    name: "Project Review",
    creator_email: "jane.smith@example.com",
    meet_datetime: "2025-08-21T14:00:00Z",
    created_at: "2025-08-20T14:00:00Z",
    invite_duration_minutes: 45,
    max_participants: 15,
    is_private: false,
    is_active: true,
    movie_started: false,
  },
  {
    id: "3",
    name: "Client Presentation",
    creator_email: "bob.johnson@example.com",
    meet_datetime: "2025-08-20T16:00:00Z",
    created_at: "2025-08-19T16:00:00Z",
    invite_duration_minutes: 60,
    max_participants: 20,
    is_private: true,
    is_active: false,
    movie_started: false,
  },
]
