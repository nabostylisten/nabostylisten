// Shared utility functions for booking operations
import { format } from "date-fns";
import { nb } from "date-fns/locale";

/**
 * Format booking date and time for display in Norwegian
 */
export function formatBookingDateTime(startTime: string, endTime: string) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const bookingDate = format(start, "EEEE d. MMMM yyyy", {
        locale: nb,
    });
    const bookingTime = `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`;

    return { bookingDate, bookingTime };
}

/**
 * Create service name with count for email display
 */
export function formatServiceName(services: { title?: string }[]) {
    const serviceName = services.length > 0
        ? services[0]?.title || "Booking"
        : "Booking";
    const serviceNameWithCount = services.length > 1
        ? `${serviceName} +${services.length - 1} til`
        : serviceName;

    return { serviceName, serviceNameWithCount };
}
