import { useQuery } from "@tanstack/react-query";
import { getStylistAverageRating } from "@/server/review.actions";

export const useStylistRating = (stylistId: string | undefined) => {
  return useQuery({
    queryKey: ["stylistRating", stylistId],
    queryFn: async () => {
      if (!stylistId) return { average: 0, count: 0 };
      
      const result = await getStylistAverageRating(stylistId);
      if (result.error) {
        console.error("Failed to fetch stylist rating:", result.error);
        return { average: 0, count: 0 };
      }
      
      return { average: result.average, count: result.count };
    },
    enabled: !!stylistId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};