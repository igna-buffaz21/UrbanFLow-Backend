import "dotenv/config"
import { createClerkClient } from "@clerk/backend"

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})

async function main() {
  const emailToCheck = "ignaciobuffaz74@gmail.com"

  const invitations = await clerkClient.invitations.getInvitationList()

  console.log("Total invitaciones:", invitations.data.length)

  const invitationsForEmail = invitations.data.filter(
    (invitation) =>
      invitation.emailAddress.toLowerCase() === emailToCheck.toLowerCase()
  )

  console.log("Invitaciones encontradas para el email:")
  console.log(
    invitationsForEmail.map((invitation) => ({
      id: invitation.id,
      email: invitation.emailAddress,
      status: invitation.status,
      createdAt: invitation.createdAt,
    }))
  )
}

main().catch((error) => {
  console.error("Error consultando invitaciones:", error)
})