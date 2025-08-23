import { Link, Section, Text } from "@react-email/components";
import { sectionStyles, textStyles } from "../emails/utils/styles";
import {
  baseUrl,
  notificationLabels,
  type NotificationType,
} from "../emails/utils";

interface NotificationSettingsProps {
  profileId: string;
  notificationType: NotificationType;
}

export const NotificationSettings = ({
  profileId,
  notificationType,
}: NotificationSettingsProps) => {
  const notificationLabel = notificationLabels[notificationType];

  return (
    <Section style={sectionStyles.settingsSection}>
      <Text style={textStyles.settingsText}>
        Du mottar denne e-posten fordi du har aktivert varsler for{" "}
        {notificationLabel}.
      </Text>
      <Link
        href={`${baseUrl}/profiler/${profileId}/preferanser`}
        style={textStyles.settingsLink}
      >
        Endre varselinnstillinger
      </Link>
    </Section>
  );
};
