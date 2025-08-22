"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"

// Define the shape of meet data
export type Meet = {
  id: string
  title: string
  description: string
  scheduled_time: string
  created_by: string
  status: "scheduled" | "active" | "ended"
  participants_count: number
}

// Handle join meet functionality
const handleJoinMeet = (meetId: string) => {
  // TODO: Implement join meeting logic
  console.log(`Joining meet with ID: ${meetId}`)
  
  // For now, let's redirect to a meeting page
  window.location.href = `/meet/${meetId}`
}

// Define columns for the meets table
export const meetColumns: ColumnDef<Meet>[] = [
  {
    accessorKey: "title",
    header: "Meeting Title",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "scheduled_time",
    header: "Scheduled Time",
    cell: ({ row }) => {
      const date = new Date(row.getValue("scheduled_time"))
      return date.toLocaleString()
    },
  },
  {
    accessorKey: "created_by",
    header: "Created By",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const statusColors = {
        scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        ended: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      }
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      )
    },
  },
  {
    accessorKey: "participants_count",
    header: "Participants",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const meet = row.original
      return (
        <Button 
          onClick={() => handleJoinMeet(meet.id)}
          disabled={meet.status === "ended"}
          variant={meet.status === "active" ? "default" : "outline"}
          size="sm"
        >
          {meet.status === "active" ? "Join Now" : meet.status === "scheduled" ? "Join" : "Ended"}
        </Button>
      )
    },
  },
]

// Legacy Payment type for backward compatibility
export type Payment = {
  id: string
  amount: number
  status: "pending" | "processing" | "success" | "failed"
  email: string
}

// Legacy payment columns for backward compatibility
export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "amount",
    header: "Amount",
  },
]
