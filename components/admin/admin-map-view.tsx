"use client";

import { useCallback } from "react";
import Map, { Source, Layer, Popup } from "react-map-gl/mapbox";
import type { MapRef, ViewStateChangeEvent } from "react-map-gl/mapbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/kibo-ui/spinner";
import { useAdminMap } from "@/hooks/admin/use-admin-map";
import { MapPin, Users, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import colors from "tailwindcss/colors";

// Import Mapbox CSS
import "mapbox-gl/dist/mapbox-gl.css";
import { CircleLayer, MapboxEvent, SymbolLayer } from "mapbox-gl";
import { brandColors } from "@/lib/brand";

// Default map configuration
const DEFAULT_ZOOM = 6;
const DEFAULT_CENTER = {
  longitude: 10.7522, // Oslo, Norway
  latitude: 59.9139,
};

// Define layer styles
const clusterLayer: CircleLayer = {
  id: "clusters",
  type: "circle",
  source: "addresses",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": [
      "step",
      ["get", "point_count"],
      colors.sky[500], // Light blue for small clusters
      10,
      colors.purple[500], // Purple for medium clusters
      30,
      colors.rose[500], // Rose for large clusters
    ],
    "circle-radius": ["step", ["get", "point_count"], 20, 10, 30, 30, 40],
    "circle-stroke-width": 2,
    "circle-stroke-color": "#ffffff",
  },
};

const clusterCountLayer: SymbolLayer = {
  id: "cluster-count",
  type: "symbol",
  source: "addresses",
  filter: ["has", "point_count"],
  layout: {
    "text-field": "{point_count_abbreviated}",
    "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
    "text-size": 12,
  },
  paint: {
    "text-color": "#ffffff",
  },
};

const unclusteredPointLayer: CircleLayer = {
  id: "unclustered-point",
  type: "circle",
  source: "addresses",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": [
      "match",
      ["get", "user_role"],
      "customer",
      colors.blue[500], // Blue for customers
      "stylist",
      colors.green[500], // Green for stylists
      "admin",
      colors.amber[500], // Amber for admins
      colors.gray[500], // Gray for unknown
    ],
    "circle-radius": 8,
    "circle-stroke-width": 2,
    "circle-stroke-color": "#ffffff",
  },
};

// Selected point layer with enhanced visibility
const selectedPointLayer: CircleLayer = {
  id: "selected-point",
  type: "circle",
  source: "selected-address",
  paint: {
    "circle-radius": 12,
    "circle-color": "rgba(255, 255, 255, 0.4)",
    "circle-stroke-width": 3,
    "circle-stroke-color": "#ffffff",
  },
};

export function AdminMapView() {
  const { resolvedTheme: theme } = useTheme();
  const {
    addresses,
    stats,
    geojsonData,
    isLoading,
    isError,
    mapRef,
    setMapRef,
  } = useAdminMap();

  const [hoveredFeature, setHoveredFeature] = useState<{
    properties: any;
    coordinates: [number, number];
  } | null>(null);

  const [viewState, setViewState] = useState({
    longitude: DEFAULT_CENTER.longitude,
    latitude: DEFAULT_CENTER.latitude,
    zoom: DEFAULT_ZOOM,
  });

  // Handle map load
  const onMapLoad = useCallback(
    (event: MapboxEvent) => {
      setMapRef(event.target);
    },
    [setMapRef]
  );

  // Handle cluster clicks (zoom to cluster with smooth animation)
  const onClusterClick = useCallback(
    (event: any) => {
      const feature = event.features[0];
      const clusterId = feature.properties.cluster_id;

      if (mapRef) {
        const source = mapRef.getSource("addresses") as any;
        source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
          if (err) return;

          // Use flyTo for smooth zoom animation
          mapRef.flyTo({
            center: [
              feature.geometry.coordinates[0],
              feature.geometry.coordinates[1],
            ],
            zoom: zoom || DEFAULT_ZOOM + 4,
            speed: 2,
            curve: 1.42,
            easing: (t) => t,
          });
        });
      }
    },
    [mapRef]
  );

  // Handle individual point clicks (show card)
  const onPointClick = useCallback((event: any) => {
    const feature = event.features?.find(
      (f: any) => f.layer?.id === "unclustered-point"
    );
    if (feature) {
      setHoveredFeature({
        properties: feature.properties,
        coordinates: [
          feature.geometry.coordinates[0],
          feature.geometry.coordinates[1],
        ],
      });
    }
  }, []);

  const closeCard = useCallback(() => {
    setHoveredFeature(null);
  }, []);

  // Handle view state changes
  const onMove = useCallback((evt: ViewStateChangeEvent) => {
    setViewState(evt.viewState);
  }, []);

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "customer":
        return "Kunde";
      case "stylist":
        return "Stylist";
      case "admin":
        return "Admin";
      default:
        return "Ukjent";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "customer":
        return "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-800";
      case "stylist":
        return "bg-green-50 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-200 dark:border-green-800";
      case "admin":
        return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800";
      default:
        return "bg-gray-50 text-gray-800 border-gray-200 dark:bg-gray-950/30 dark:text-gray-200 dark:border-gray-800";
    }
  };

  // Reset map to default view and clear selection
  const resetMapView = useCallback(() => {
    if (mapRef) {
      mapRef.flyTo({
        center: [DEFAULT_CENTER.longitude, DEFAULT_CENTER.latitude],
        zoom: DEFAULT_ZOOM,
        speed: 1.5,
        curve: 1.42,
        easing: (t) => t,
      });
    }
    // Clear selected marker
    setHoveredFeature(null);
  }, [mapRef]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with stats */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <h1 className="text-xl font-semibold">Geografisk oversikt</h1>
          </div>
          {isLoading && <Spinner />}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Totalt</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                adresser
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Kunder
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                {stats.customers}
              </div>
              <Badge
                variant="outline"
                className="text-xs border-blue-200 text-blue-800 dark:border-blue-800 dark:text-blue-200"
              >
                {stats.total > 0
                  ? Math.round((stats.customers / stats.total) * 100)
                  : 0}
                %
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">
                Stylister
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                {stats.stylists}
              </div>
              <Badge
                variant="outline"
                className="text-xs border-green-200 text-green-800 dark:border-green-800 dark:text-green-200"
              >
                {stats.total > 0
                  ? Math.round((stats.stylists / stats.total) * 100)
                  : 0}
                %
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Admins
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-amber-800 dark:text-amber-200">
                {stats.admins}
              </div>
              <Badge
                variant="outline"
                className="text-xs border-amber-200 text-amber-800 dark:border-amber-800 dark:text-amber-200"
              >
                {stats.total > 0
                  ? Math.round((stats.admins / stats.total) * 100)
                  : 0}
                %
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Kunder</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Stylister</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>Admins</span>
          </div>
        </div>
      </div>

      {/* Map container */}
      <div className="h-[40rem] relative">
        {/* Map controls */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={resetMapView}
            className="bg-background/90 backdrop-blur-sm shadow-lg hover:bg-background/95"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Tilbakestill zoom
          </Button>
        </div>

        <div className="absolute inset-0 rounded-lg overflow-hidden border">
          <Map
            {...viewState}
            onMove={onMove}
            onLoad={onMapLoad}
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            interactiveLayerIds={["clusters", "unclustered-point"]}
            onClick={(event) => {
              const features = event.features;
              if (features && features.length > 0) {
                const feature = features[0];
                if (feature.layer?.id === "clusters") {
                  onClusterClick(event);
                } else if (feature.layer?.id === "unclustered-point") {
                  onPointClick(event);
                }
              }
            }}
            cursor="pointer"
          >
            {addresses.length > 0 && (
              <>
                <Source
                  id="addresses"
                  type="geojson"
                  data={geojsonData}
                  cluster={true}
                  clusterMaxZoom={14}
                  clusterRadius={50}
                >
                  <Layer {...clusterLayer} />
                  <Layer {...clusterCountLayer} />
                  <Layer {...unclusteredPointLayer} />
                </Source>

                {hoveredFeature && (
                  <>
                    <Source
                      id="selected-address"
                      type="geojson"
                      data={{
                        type: "FeatureCollection",
                        features: [
                          {
                            type: "Feature",
                            properties: {},
                            geometry: {
                              type: "Point",
                              coordinates: hoveredFeature.coordinates,
                            },
                          },
                        ],
                      }}
                    >
                      <Layer {...selectedPointLayer} />
                    </Source>

                    {/* Pulse ring 1 */}
                    <Source
                      id="selected-address-pulse-1"
                      type="geojson"
                      data={{
                        type: "FeatureCollection",
                        features: [
                          {
                            type: "Feature",
                            properties: {},
                            geometry: {
                              type: "Point",
                              coordinates: hoveredFeature.coordinates,
                            },
                          },
                        ],
                      }}
                    >
                      <Layer
                        {...{
                          id: "selected-point-pulse-1",
                          type: "circle" as const,
                          source: "selected-address-pulse-1",
                          paint: {
                            "circle-radius": 18,
                            "circle-color": "rgba(59, 130, 246, 0.15)", // Blue with low opacity
                            "circle-stroke-width": 2,
                            "circle-stroke-color": "rgba(59, 130, 246, 0.4)",
                          },
                        }}
                      />
                    </Source>

                    {/* Pulse ring 2 */}
                    <Source
                      id="selected-address-pulse-2"
                      type="geojson"
                      data={{
                        type: "FeatureCollection",
                        features: [
                          {
                            type: "Feature",
                            properties: {},
                            geometry: {
                              type: "Point",
                              coordinates: hoveredFeature.coordinates,
                            },
                          },
                        ],
                      }}
                    >
                      <Layer
                        {...{
                          id: "selected-point-pulse-2",
                          type: "circle" as const,
                          source: "selected-address-pulse-2",
                          paint: {
                            "circle-radius": 25,
                            "circle-color": "rgba(59, 130, 246, 0.08)",
                            "circle-stroke-width": 1,
                            "circle-stroke-color": "rgba(59, 130, 246, 0.2)",
                          },
                        }}
                      />
                    </Source>
                  </>
                )}
              </>
            )}
          </Map>
        </div>

        {/* Feature information card */}
        {hoveredFeature && (
          <div className="absolute top-4 left-4 z-20 w-80">
            <Card className="shadow-lg animate-in slide-in-from-left-2 duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge
                    className={`text-xs ${getRoleColor(
                      hoveredFeature.properties.user_role
                    )}`}
                  >
                    {getRoleDisplayName(hoveredFeature.properties.user_role)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeCard}
                    className="h-6 w-6 p-0 hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-base">
                  {hoveredFeature.properties.user_name}
                </CardTitle>
                {hoveredFeature.properties.user_email && (
                  <p className="text-sm text-muted-foreground">
                    {hoveredFeature.properties.user_email}
                  </p>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  <p className="font-medium text-sm">
                    {hoveredFeature.properties.street_address}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hoveredFeature.properties.postal_code}{" "}
                    {hoveredFeature.properties.city}
                  </p>
                  {hoveredFeature.properties.nickname && (
                    <p className="text-sm text-muted-foreground italic mt-2">
                      "{hoveredFeature.properties.nickname}"
                    </p>
                  )}
                  {hoveredFeature.properties.is_primary && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      Primæradresse
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
            <div className="bg-background p-4 rounded-lg shadow-lg flex items-center gap-2">
              <Spinner />
              <span>Laster kart...</span>
            </div>
          </div>
        )}
        {isError && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
            <div className="bg-background p-4 rounded-lg shadow-lg text-center">
              <p className="text-red-600 mb-2">Kunne ikke laste kartdata</p>
              <p className="text-sm text-muted-foreground">
                Prøv å oppdatere siden
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
