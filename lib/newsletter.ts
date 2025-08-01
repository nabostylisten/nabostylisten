import {
    ContactsApi,
    ContactsApiApiKeys,
    CreateContact,
} from "@getbrevo/brevo";

// Initialize the Brevo client with API key
export function initializeBrevoClient(): ContactsApi {
    const contactsApi = new ContactsApi();
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
        throw new Error("BREVO_API_KEY environment variable is required");
    }

    contactsApi.setApiKey(ContactsApiApiKeys.apiKey, apiKey);
    return contactsApi;
}

// Interface for contact data
export interface ContactData {
    email: string;
    firstName?: string;
    lastName?: string;
    attributes?: Record<string, unknown>;
}

// Add a new contact to Brevo
export async function addContactToBrevo(
    contactData: ContactData,
): Promise<unknown> {
    try {
        const contactsApi = initializeBrevoClient();

        const contact = new CreateContact();
        contact.email = contactData.email;

        // Set up attributes object
        const attributes: Record<string, { value: string }> = {};

        if (contactData.firstName) {
            attributes.FIRSTNAME = { value: contactData.firstName };
        }

        if (contactData.lastName) {
            attributes.LASTNAME = { value: contactData.lastName };
        }

        // Add any additional attributes
        if (contactData.attributes) {
            Object.entries(contactData.attributes).forEach(([key, value]) => {
                attributes[key.toUpperCase()] = { value: String(value) };
            });
        }

        contact.attributes = attributes;

        const result = await contactsApi.createContact(contact);
        console.log("Contact created successfully:", result.body);
        return result.body;
    } catch (error) {
        console.error("Error creating contact:", error);
        throw error;
    }
}

// Get contacts from Brevo (optional utility function)
export async function getContacts(
    limit: number = 10,
    offset: number = 0,
): Promise<unknown> {
    try {
        const contactsApi = initializeBrevoClient();
        const result = await contactsApi.getContacts(limit, offset);
        return result.body;
    } catch (error) {
        console.error("Error getting contacts:", error);
        throw error;
    }
}

// Subscribe to newsletter (wrapper function for adding contact)
export async function subscribeToNewsletter(
    email: string,
    firstName?: string,
    lastName?: string,
): Promise<unknown> {
    return addContactToBrevo({
        email,
        firstName,
        lastName,
        attributes: {
            SOURCE: "website",
            SUBSCRIBED_AT: new Date().toISOString(),
        },
    });
}
