"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandItem, CommandEmpty, CommandGroup } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { meetsAPI, moviesAPI } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Movie {
  id: string;
  title: string;
  genre: string;
}

export default function CreateMeet() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    meet_datetime: "",
    invite_duration_minutes: 30,
    max_participants: 10,
    is_private: false,
    movie: undefined as string | undefined
  });
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await moviesAPI.getMovies({ is_active: true });
        const data = response.data.results || response.data;
        setMovies(data);
      } catch (error) {
        console.error('Failed to fetch movies:', error);
      }
    };

    fetchMovies();
  }, []);

  const filteredMovies = movies.filter((movie) => 
    movie.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.meet_datetime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await meetsAPI.createRoom(formData);
      toast.success("Meeting room created successfully!");
      navigate("/meets");
    } catch (error: any) {
      console.error("Error creating room:", error);
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || "Failed to create room";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('/background.jpg')] bg-cover bg-center p-4">
      <Card className="w-full max-w-2xl backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">Create Meeting Room</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Room Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Room Name *</Label>
              <Input
                id="name"
                placeholder="Enter room name"
                className="bg-white/20 text-white placeholder:text-gray-300"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            {/* Description (now invite duration) */}
            <div className="space-y-2">
              <Label htmlFor="inviteDuration" className="text-white">Invite Duration (minutes)</Label>
              <Input
                id="inviteDuration"
                type="number"
                min="5"
                max="1440"
                placeholder="Enter invite duration in minutes"
                className="bg-white/20 text-white placeholder:text-gray-300"
                value={formData.invite_duration_minutes}
                onChange={(e) => handleInputChange('invite_duration_minutes', Number(e.target.value))}
              />
            </div>

            {/* Scheduled Start Time */}
            <div className="space-y-2">
              <Label htmlFor="meetDateTime" className="text-white">Meeting Date & Time *</Label>
              <Input
                id="meetDateTime"
                type="datetime-local"
                className="bg-white/20 text-white"
                value={formData.meet_datetime}
                onChange={(e) => handleInputChange('meet_datetime', e.target.value)}
                required
              />
            </div>

            {/* Max Participants */}
            <div className="space-y-2">
              <Label htmlFor="maxParticipants" className="text-white">Max Participants</Label>
              <Input
                id="maxParticipants"
                type="number"
                min="2"
                max="100"
                className="bg-white/20 text-white"
                value={formData.max_participants}
                onChange={(e) => handleInputChange('max_participants', Number(e.target.value))}
              />
            </div>

            {/* Movie Selection */}
            <div className="space-y-2">
              <Label className="text-white">Select Movie (Optional)</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between bg-white/20 text-white border-white/30 hover:bg-white/30"
                  >
                    {selectedMovie || "Select a movie..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search movies..."
                      value={search}
                      onValueChange={setSearch}
                    />
                    <CommandEmpty>No movies found.</CommandEmpty>
                    <CommandGroup>
                      {filteredMovies.map((movie) => (
                        <CommandItem
                          key={movie.id}
                          onSelect={() => {
                            setSelectedMovie(movie.title);
                            handleInputChange('movie', movie.id);
                            setOpen(false);
                          }}
                        >
                          {movie.title}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Is Private */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isPrivate" 
                checked={formData.is_private}
                onCheckedChange={(checked) => handleInputChange('is_private', checked as boolean)}
              />
              <Label htmlFor="isPrivate" className="text-white">Private Room</Label>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Room"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
