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
        description: "Finn den perfekte stylisten for dine behov",
        items: [
            {
                title: "Hår",
                href: "/services/hair",
                description: "Klipp, farge og styling",
            },
            {
                title: "Negler",
                href: "/services/nails",
                description: "Manikyr og pedikyr",
            },
            {
                title: "Sminke",
                href: "/services/makeup",
                description: "Profesjonell sminke",
            },
            {
                title: "Vipper & Bryn",
                href: "/services/lashes-brows",
                description: "Vipper og brynbehandling",
            },
        ],
    },
    {
        title: "Om oss",
        href: "/about",
        description: "Lær mer om Nabostylisten",
    },
    {
        title: "Kontakt",
        href: "/contact",
        description: "Ta kontakt med oss",
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
