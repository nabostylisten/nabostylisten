import { ProfileSidebar } from "./profile-sidebar";

interface ProfileLayoutProps {
  profileId: string;
  children: React.ReactNode;
}

export const ProfileLayout = ({ profileId, children }: ProfileLayoutProps) => {
  return (
    <div className="min-h-[calc(100vh-2rem)]">
      <div className="flex">
        {/* Desktop sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <ProfileSidebar
            profileId={profileId}
            className="w-64 bg-background sticky self-start"
          />
        </div>

        {/* Main content area */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};
