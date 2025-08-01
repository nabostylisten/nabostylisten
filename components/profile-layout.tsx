import { ProfileSidebar } from "./profile-sidebar";

interface ProfileLayoutProps {
  profileId: string;
  children: React.ReactNode;
}

export const ProfileLayout = ({ profileId, children }: ProfileLayoutProps) => {
  return (
    <div className="flex min-h-screen pt-16">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <ProfileSidebar
          profileId={profileId}
          className="fixed h-screen top-16"
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 md:ml-64">{children}</div>
    </div>
  );
};
