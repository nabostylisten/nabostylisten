"use client"

import { AvailabilityScheduler } from "@/components/availability-scheduler"

interface AvailabilitySchedulerWrapperProps {
  stylistId: string
}

export function AvailabilitySchedulerWrapper({ stylistId }: AvailabilitySchedulerWrapperProps) {
  return <AvailabilityScheduler stylistId={stylistId} />
}