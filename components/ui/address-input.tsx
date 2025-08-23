"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { MapPin, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/kibo-ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { MapboxSuggestion } from "@/types";

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: MapboxSuggestion) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function AddressInput({
  value,
  onChange,
  onSelect,
  placeholder = "Lokasjon",
  className,
  disabled,
  onKeyDown,
}: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<MapboxSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [justSelected, setJustSelected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const searchAddresses = useCallback(
    async (query: string) => {
      if (!query || query.length < 3 || !accessToken || justSelected) {
        setSuggestions([]);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          access_token: accessToken,
          country: "no",
          types: "place,postcode,locality,neighborhood,address",
          language: "no",
          limit: "6",
          autocomplete: "true",
        });

        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`;

        const response = await fetch(url, {
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Mapbox API error: ${response.status}`);
        }

        const data = await response.json();
        setSuggestions(data.features || []);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Error searching addresses:", error);
          setSuggestions([]);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, justSelected]
  );

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchAddresses(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, searchAddresses]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (onKeyDown) {
      onKeyDown(e);
    }

    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelectSuggestion = (suggestion: MapboxSuggestion) => {
    onChange(suggestion.place_name);
    onSelect?.(suggestion);
    setIsOpen(false);
    setSelectedIndex(-1);
    setSuggestions([]);
    setJustSelected(true);
    // Clear the input focus to prevent suggestions from showing again immediately
    inputRef.current?.blur();
    
    // Reset the justSelected flag after a short delay
    setTimeout(() => setJustSelected(false), 500);
  };

  if (!accessToken) {
    // Fallback to regular input if no token
    return (
      <div className="relative">
        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          className={cn("pl-10", className)}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
      {isLoading && (
        <div className="absolute right-3 top-2.5 z-10">
          <Spinner variant="circle" className="h-4 w-4" />
        </div>
      )}
      <Input
        ref={inputRef}
        placeholder={placeholder}
        className={cn("pl-10", isLoading && "pr-10", className)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0 && !justSelected) {
            setIsOpen(true);
          }
        }}
        disabled={disabled}
        autoComplete="off"
      />

      {/* Suggestions dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-60 overflow-y-auto">
          {isLoading && suggestions.length === 0 ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <Button
                key={suggestion.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left font-normal p-3 h-auto whitespace-normal",
                  index === selectedIndex && "bg-accent"
                )}
                onClick={() => handleSelectSuggestion(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <ChevronRight className="h-4 w-4 mr-2 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm">
                    {suggestion.place_name}
                  </div>
                </div>
              </Button>
            ))
          ) : value.length >= 3 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              Ingen adresser funnet
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
