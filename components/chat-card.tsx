import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Calendar, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";

interface ChatCardProps {
  chatId: string;
  bookingId: string;
  partnerName: string;
  serviceTitles: string[];
  bookingDate: string;
  bookingStatus: string;
  lastMessageTime: string;
  currentUserId: string;
  isCustomer: boolean;
  unreadCount?: number;
}

export function ChatCard({
  chatId,
  bookingId,
  partnerName,
  serviceTitles,
  bookingDate,
  bookingStatus,
  lastMessageTime,
  currentUserId,
  isCustomer,
  unreadCount = 0,
}: ChatCardProps) {
  const relativeTime = formatDistanceToNow(new Date(lastMessageTime), {
    addSuffix: true,
    locale: nb,
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "pending":
        return "secondary";
      case "completed":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Bekreftet";
      case "pending":
        return "Avventer";
      case "completed":
        return "Fullført";
      case "cancelled":
        return "Avlyst";
      default:
        return status;
    }
  };

  return (
    <Card
      className={`hover:shadow-md transition-shadow ${unreadCount > 0 ? "border-primary/50 bg-primary/5" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1">
              <MessageCircle className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-muted-foreground" />
                <span
                  className={`text-sm ${unreadCount > 0 ? "font-semibold" : "font-medium"}`}
                >
                  {isCustomer ? "Stylist" : "Kunde"}: {partnerName}
                </span>
                {unreadCount > 0 && (
                  <Badge variant="default" className="text-xs">
                    {unreadCount} ny{unreadCount !== 1 ? "e" : ""} melding
                    {unreadCount !== 1 ? "er" : ""}
                  </Badge>
                )}
              </div>

              <div className="text-sm text-muted-foreground mb-2">
                <div className="flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(bookingDate).toLocaleDateString("nb-NO", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {serviceTitles.length > 0 && (
                  <div className="text-xs">{serviceTitles.join(", ")}</div>
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Badge
                  variant={getStatusVariant(bookingStatus)}
                  className="text-xs"
                >
                  {getStatusLabel(bookingStatus)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Sist aktiv {relativeTime}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              asChild
              variant={unreadCount > 0 ? "default" : "outline"}
            >
              <Link href={`/bookinger/${bookingId}/chat`}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Åpne chat
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
