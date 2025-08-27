import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { baseStyles, sectionStyles, textStyles } from "./utils/styles";
import { baseUrl } from "./utils";

interface WeeklyMetrics {
  // User metrics
  newUsers: {
    total: number;
    customers: number;
    stylists: number;
    previousWeek: number;
  };
  totalUsers: {
    total: number;
    customers: number;
    stylists: number;
  };

  // Booking metrics
  bookings: {
    total: number;
    completed: number;
    cancelled: number;
    pending: number;
    averageValue: number;
    totalValue: number;
    previousWeekTotal: number;
  };

  // Revenue metrics
  revenue: {
    totalBookingsValue: number;
    platformFees: number;
    stylistPayouts: number;
    previousWeekRevenue: number;
  };

  // Top performers
  topStylists: Array<{
    name: string;
    bookingsCount: number;
    averageRating: number;
    totalEarnings: number;
  }>;

  // Service popularity
  popularServices: Array<{
    categoryName: string;
    bookingsCount: number;
    averagePrice: number;
  }>;

  // Applications
  applications: {
    newApplications: number;
    pendingReview: number;
    approved: number;
    rejected: number;
  };

  // Engagement metrics
  engagement: {
    reviewsLeft: number;
    chatMessages: number;
  };
}

interface AdminWeeklyDigestEmailProps {
  logoUrl: string;
  weekStart: string;
  weekEnd: string;
  metrics: WeeklyMetrics;
}

// Helper function to format percentage change
const formatPercentChange = (
  current: number,
  previous: number
): { value: number; isPositive: boolean } => {
  if (previous === 0) return { value: 0, isPositive: true };
  const change = ((current - previous) / previous) * 100;
  return { value: Math.abs(change), isPositive: change >= 0 };
};

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// KPI Card Component
const KpiCard = ({
  title,
  value,
  previousValue,
  format = "number",
}: {
  title: string;
  value: number;
  previousValue?: number;
  format?: "number" | "currency" | "percentage";
}) => {
  const formatValue = (val: number) => {
    switch (format) {
      case "currency":
        return formatCurrency(val);
      case "percentage":
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString("nb-NO");
    }
  };

  const trend =
    previousValue !== undefined
      ? formatPercentChange(value, previousValue)
      : null;

  return (
    <div
      style={{
        backgroundColor: "#f8f6ff",
        border: "1px solid #edeaf7",
        borderRadius: "10px",
        padding: "20px",
        margin: "8px 0",
        textAlign: "center",
      }}
    >
      <Text
        style={{
          fontSize: "14px",
          color: "#6b6682",
          margin: "0 0 8px",
          fontWeight: "500",
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: "24px",
          fontWeight: "700",
          color: "#453a6b",
          margin: "0",
        }}
      >
        {formatValue(value)}
      </Text>
      {trend && (
        <Text
          style={{
            fontSize: "12px",
            color: trend.isPositive ? "#4a7c4a" : "#ff3333",
            margin: "4px 0 0",
            fontWeight: "500",
          }}
        >
          {trend.isPositive ? "↗" : "↘"} {trend.value.toFixed(1)}% fra forrige
          uke
        </Text>
      )}
    </div>
  );
};

// Simple table row component
const TableRow = ({
  label,
  value,
  format = "text",
}: {
  label: string;
  value: string | number;
  format?: "text" | "currency" | "number";
}) => {
  const formatValue = (val: string | number) => {
    if (typeof val === "string") return val;
    switch (format) {
      case "currency":
        return formatCurrency(val);
      case "number":
        return val.toLocaleString("nb-NO");
      default:
        return val.toString();
    }
  };

  return (
    <tr style={{ borderBottom: "1px solid #edeaf7" }}>
      <td
        style={{
          padding: "12px 8px",
          fontSize: "14px",
          color: "#453a6b",
          fontWeight: "500",
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: "12px 8px",
          fontSize: "14px",
          color: "#453a6b",
          textAlign: "right",
          fontWeight: "600",
        }}
      >
        {formatValue(value)}
      </td>
    </tr>
  );
};

export const AdminWeeklyDigestEmail = ({
  logoUrl,
  weekStart = "13. januar 2025",
  weekEnd = "19. januar 2025",
  metrics,
}: AdminWeeklyDigestEmailProps) => {
  // These could be used for future trend indicators in the email if needed
  // const userGrowth = formatPercentChange(metrics.newUsers.total, metrics.newUsers.previousWeek);
  // const bookingGrowth = formatPercentChange(metrics.bookings.total, metrics.bookings.previousWeekTotal);
  // const revenueGrowth = formatPercentChange(metrics.revenue.totalBookingsValue, metrics.revenue.previousWeekRevenue);

  return (
    <Html>
      <Head />
      <Preview>
        Nabostylisten - Ukentlig administratorsammendrag ({weekStart} -{" "}
        {weekEnd})
      </Preview>
      <Body style={baseStyles.main}>
        <Container style={baseStyles.container}>
          <Section style={baseStyles.logoContainer}>
            <Img
              src={logoUrl}
              width="120"
              height="36"
              alt="Nabostylisten"
              style={baseStyles.logo}
            />
          </Section>

          <Heading style={baseStyles.heading}>
            Ukentlig Administratorsammendrag
          </Heading>

          <Text style={baseStyles.paragraph}>
            Her er en oversikt over plattformens aktivitet fra {weekStart} til{" "}
            {weekEnd}.
          </Text>

          {/* Overview KPIs */}
          <Section style={sectionStyles.infoSection}>
            <Text style={textStyles.sectionHeader}>Nøkkelmetrikker</Text>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <KpiCard
                title="Nye brukere"
                value={metrics.newUsers.total}
                previousValue={metrics.newUsers.previousWeek}
              />
              <KpiCard
                title="Totale bookinger"
                value={metrics.bookings.total}
                previousValue={metrics.bookings.previousWeekTotal}
              />
              <KpiCard
                title="Booking-inntekter"
                value={metrics.revenue.totalBookingsValue}
                previousValue={metrics.revenue.previousWeekRevenue}
                format="currency"
              />
              <KpiCard
                title="Plattformgebyrer"
                value={metrics.revenue.platformFees}
                format="currency"
              />
            </div>
          </Section>

          {/* User Statistics */}
          <Section style={sectionStyles.detailsSection}>
            <Text style={textStyles.sectionHeader}>Brukerstatistikk</Text>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <TableRow
                label="Nye kunder"
                value={metrics.newUsers.customers}
                format="number"
              />
              <TableRow
                label="Nye stylister"
                value={metrics.newUsers.stylists}
                format="number"
              />
              <TableRow
                label="Totale kunder"
                value={metrics.totalUsers.customers}
                format="number"
              />
              <TableRow
                label="Totale stylister"
                value={metrics.totalUsers.stylists}
                format="number"
              />
            </table>
          </Section>

          {/* Booking Statistics */}
          <Section style={sectionStyles.infoSection}>
            <Text style={textStyles.sectionHeader}>Booking-statistikk</Text>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <KpiCard
                title="Fullførte bookinger"
                value={metrics.bookings.completed}
              />
              <KpiCard
                title="Avlyste bookinger"
                value={metrics.bookings.cancelled}
              />
              <KpiCard
                title="Gjennomsnittlig verdi"
                value={metrics.bookings.averageValue}
                format="currency"
              />
              <KpiCard
                title="Ventende bookinger"
                value={metrics.bookings.pending}
              />
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <TableRow
                label="Total booking-verdi"
                value={metrics.revenue.totalBookingsValue}
                format="currency"
              />
              <TableRow
                label="Utbetalt til stylister"
                value={metrics.revenue.stylistPayouts}
                format="currency"
              />
            </table>
          </Section>

          {/* Top Performers */}
          <Section style={sectionStyles.detailsSection}>
            <Text style={textStyles.sectionHeader}>Toppytende stylister</Text>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #c2724a" }}>
                  <th
                    style={{
                      padding: "8px",
                      textAlign: "left",
                      fontSize: "12px",
                      color: "#c2724a",
                      fontWeight: "600",
                    }}
                  >
                    Stylist
                  </th>
                  <th
                    style={{
                      padding: "8px",
                      textAlign: "center",
                      fontSize: "12px",
                      color: "#c2724a",
                      fontWeight: "600",
                    }}
                  >
                    Bookinger
                  </th>
                  <th
                    style={{
                      padding: "8px",
                      textAlign: "center",
                      fontSize: "12px",
                      color: "#c2724a",
                      fontWeight: "600",
                    }}
                  >
                    Rating
                  </th>
                  <th
                    style={{
                      padding: "8px",
                      textAlign: "right",
                      fontSize: "12px",
                      color: "#c2724a",
                      fontWeight: "600",
                    }}
                  >
                    Inntjening
                  </th>
                </tr>
              </thead>
              <tbody>
                {metrics.topStylists.map((stylist, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid #fee7dc" }}>
                    <td
                      style={{
                        padding: "8px",
                        fontSize: "13px",
                        color: "#453a6b",
                      }}
                    >
                      {stylist.name}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        fontSize: "13px",
                        color: "#453a6b",
                        fontWeight: "600",
                      }}
                    >
                      {stylist.bookingsCount}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        fontSize: "13px",
                        color: "#453a6b",
                        fontWeight: "600",
                      }}
                    >
                      {stylist.averageRating.toFixed(1)}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "right",
                        fontSize: "13px",
                        color: "#453a6b",
                        fontWeight: "600",
                      }}
                    >
                      {formatCurrency(stylist.totalEarnings)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          {/* Popular Services */}
          <Section style={sectionStyles.infoSection}>
            <Text style={textStyles.sectionHeader}>Populære tjenester</Text>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #9b8cc8" }}>
                  <th
                    style={{
                      padding: "8px",
                      textAlign: "left",
                      fontSize: "12px",
                      color: "#9b8cc8",
                      fontWeight: "600",
                    }}
                  >
                    Kategori
                  </th>
                  <th
                    style={{
                      padding: "8px",
                      textAlign: "center",
                      fontSize: "12px",
                      color: "#9b8cc8",
                      fontWeight: "600",
                    }}
                  >
                    Bookinger
                  </th>
                  <th
                    style={{
                      padding: "8px",
                      textAlign: "right",
                      fontSize: "12px",
                      color: "#9b8cc8",
                      fontWeight: "600",
                    }}
                  >
                    Gj.snitt pris
                  </th>
                </tr>
              </thead>
              <tbody>
                {metrics.popularServices.map((service, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid #edeaf7" }}>
                    <td
                      style={{
                        padding: "8px",
                        fontSize: "13px",
                        color: "#453a6b",
                      }}
                    >
                      {service.categoryName}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        fontSize: "13px",
                        color: "#453a6b",
                        fontWeight: "600",
                      }}
                    >
                      {service.bookingsCount}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "right",
                        fontSize: "13px",
                        color: "#453a6b",
                        fontWeight: "600",
                      }}
                    >
                      {formatCurrency(service.averagePrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          {/* Applications & Engagement */}
          <Section style={sectionStyles.detailsSection}>
            <Text style={textStyles.sectionHeader}>Søknader & Engasjement</Text>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <KpiCard
                title="Nye søknader"
                value={metrics.applications.newApplications}
              />
              <KpiCard
                title="Venter på godkjenning"
                value={metrics.applications.pendingReview}
              />
              <KpiCard
                title="Anmeldelser denne uken"
                value={metrics.engagement.reviewsLeft}
              />
              <KpiCard
                title="Chat-meldinger"
                value={metrics.engagement.chatMessages}
              />
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <TableRow
                label="Godkjente søknader"
                value={metrics.applications.approved}
                format="number"
              />
              <TableRow
                label="Avslåtte søknader"
                value={metrics.applications.rejected}
                format="number"
              />
            </table>
          </Section>

          <Hr style={baseStyles.hr} />

          {/* Admin Panel Button */}
          <Section style={sectionStyles.actionSection}>
            <Button
              style={{
                backgroundColor: "#9b8cc8",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: "600",
                textDecoration: "none",
                textAlign: "center" as const,
                display: "inline-block",
                padding: "14px 28px",
                margin: "16px 0",
                boxShadow: "0 2px 4px rgba(155, 140, 200, 0.3)",
              }}
              href={`${baseUrl}/admin`}
            >
              Se administratorpanel
            </Button>
          </Section>

          <Text style={baseStyles.footer}>
            Dette er din ukentlige sammendrag fra Nabostylisten.
            <br />
            For mer detaljerte analyser, klikk på knappen ovenfor.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

AdminWeeklyDigestEmail.PreviewProps = {
  logoUrl: "https://example.com/logo.png",
  weekStart: "13. januar 2025",
  weekEnd: "19. januar 2025",
  metrics: {
    newUsers: {
      total: 28,
      customers: 23,
      stylists: 5,
      previousWeek: 22,
    },
    totalUsers: {
      total: 1247,
      customers: 1089,
      stylists: 158,
    },
    bookings: {
      total: 156,
      completed: 134,
      cancelled: 12,
      pending: 10,
      averageValue: 850,
      totalValue: 132600,
      previousWeekTotal: 142,
    },
    revenue: {
      totalBookingsValue: 132600,
      platformFees: 19890,
      stylistPayouts: 112710,
      previousWeekRevenue: 120700,
    },
    topStylists: [
      {
        name: "Anna Larsen",
        bookingsCount: 12,
        averageRating: 4.8,
        totalEarnings: 9600,
      },
      {
        name: "Erik Nordahl",
        bookingsCount: 11,
        averageRating: 4.7,
        totalEarnings: 8800,
      },
      {
        name: "Maria Santos",
        bookingsCount: 10,
        averageRating: 4.9,
        totalEarnings: 8200,
      },
    ],
    popularServices: [
      { categoryName: "Hår", bookingsCount: 89, averagePrice: 850 },
      { categoryName: "Negler", bookingsCount: 34, averagePrice: 650 },
      { categoryName: "Makeup", bookingsCount: 23, averagePrice: 1200 },
    ],
    applications: {
      newApplications: 8,
      pendingReview: 15,
      approved: 3,
      rejected: 2,
    },
    engagement: {
      reviewsLeft: 87,
      chatMessages: 423,
      averageResponseTime: 2.4,
    },
  },
} as AdminWeeklyDigestEmailProps;

export default AdminWeeklyDigestEmail;
