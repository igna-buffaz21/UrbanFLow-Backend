import "dotenv/config"
import { createClerkClient } from "@clerk/backend"

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})

async function main() {
  const email = "ignaciobuffaz74@gmail.com"

  const users = await clerkClient.users.getUserList({
    emailAddress: [email],
  })

  console.log("Total usuarios encontrados:", users.data.length)

  console.log(
    users.data.map((user) => ({
      id: user.id,
      emailAddresses: user.emailAddresses.map((email) => ({
        id: email.id,
        emailAddress: email.emailAddress,
        verificationStatus: email.verification?.status,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }))
  )
}

main().catch((error) => {
  console.error("Error consultando usuarios:", error)
})