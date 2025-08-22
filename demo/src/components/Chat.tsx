import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'

interface Message {
  message: string
  username: string
  timestamp?: string
  type?: string
}

interface ChatProps {
  roomId: string
}

export default function Chat({ roomId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [ws, setWs] = useState<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    console.log('Chat component mounted with:', { user: user?.email, roomId })
    if (!user || !roomId) {
      console.log('Missing user or roomId, not connecting to WebSocket')
      return
    }

    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const token = localStorage.getItem('access_token')
    const wsUrl = `${protocol}//localhost:8000/ws/room/${roomId}/?token=${token}`
    
    console.log('Connecting to WebSocket:', wsUrl)
    
    const websocket = new WebSocket(wsUrl)

    websocket.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
    }

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('Received message:', data)
      
      if (data.type === 'movie_started' || data.type === 'movie_stopped') {
        // Handle movie status messages
        setMessages(prev => [...prev, {
          message: data.message,
          username: 'System',
          timestamp: data.started_at || data.stopped_at,
          type: data.type
        }])
      } else {
        // Handle regular chat messages
        setMessages(prev => [...prev, {
          message: data.message,
          username: data.username,
          timestamp: data.timestamp
        }])
      }
    }

    websocket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason)
      setIsConnected(false)
    }

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
      setIsConnected(false)
    }

    setWs(websocket)

    return () => {
      websocket.close()
    }
  }, [user, roomId])

  const sendMessage = () => {
    if (!ws || !newMessage.trim() || !isConnected) return

    const messageData = {
      message: newMessage.trim()
    }

    console.log('Sending message:', messageData)
    ws.send(JSON.stringify(messageData))
    setNewMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex flex-col h-full rounded-lg">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200  rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-gray-800 font-medium">Live Chat</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 ">
        <div className="space-y-3">
          {messages.map((msg, index) => (
            <div key={index} className={`flex flex-col ${msg.type ? 'items-center' : 'items-start'}`}>
              {msg.type ? (
                // System messages (movie started/stopped)
                <div className=" text-blue-700 px-3 py-2 rounded-lg text-sm text-center border border-blue-200">
                  {msg.message}
                </div>
              ) : (
                // Regular chat messages
                <div className={`max-w-xs lg:max-w-md ${
                  msg.username === user?.email ? 'self-end' : 'self-start'
                }`}>
                  <div className={`p-3 rounded-lg shadow-sm ${
                    msg.username === user?.email 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}>
                    <div className={`text-xs mb-1 ${
                      msg.username === user?.email ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {msg.username === user?.email ? 'You' : msg.username} 
                      {msg.timestamp && ` • ${formatTime(msg.timestamp)}`}
                    </div>
                    <div className="text-sm">
                      {msg.message}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            disabled={!isConnected}
            className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
          <Button
            onClick={sendMessage}
            disabled={!isConnected || !newMessage.trim()}
            size="icon"
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
