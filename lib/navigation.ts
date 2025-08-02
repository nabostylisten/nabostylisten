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
