export interface NavigationItem {
    title: string;
    href?: string;
    description?: string;
    items?: {
        title: string;
        href: string;
        description?: string;
    }[];
}

export const navigationItems: NavigationItem[] = [
    {
        title: "Tjenester",
        href: "/tjenester",
        description: "Finn den perfekte stylisten for dine behov",
    },
];

// Authenticated user navigation items
export const authenticatedNavigationItems: NavigationItem[] = [
    {
        title: "Mine bookinger",
        href: "/protected/bookings",
        description: "Se dine kommende og tidligere bookinger",
    },
    {
        title: "Profil",
        href: "/protected/profile",
        description: "Administrer din profil",
    },
];
