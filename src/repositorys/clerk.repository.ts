import { createClerkClient } from "@clerk/backend";
import { UserRole } from "../data/user.model";

const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY
});

interface CreateUserInvitationData {
    email: string;
    role: UserRole;
    municipalityId?: string;
}

export class ClerkRepository {
    static async createUserInvitation(data: CreateUserInvitationData) {
        try {
            return await clerkClient.invitations.createInvitation({
                emailAddress: data.email,
                redirectUrl: process.env.CLERK_INVITATION_REDIRECT_URL,
                notify: true,
                ignoreExisting: false,
                publicMetadata: {
                    role: data.role,
                    municipalityId: data.municipalityId
                }
            });
        } 
        catch (err) {
            throw new Error("Error al crear la invitación en Clerk: " + err);
        }
    }

    static async revokeUserInvitation(invitationId: string) {
        try {
            return await clerkClient.invitations.revokeInvitation(invitationId);
        } 
        catch (err) {
            throw new Error("Error al revocar la invitación en Clerk: " + err);
        }
    }
}