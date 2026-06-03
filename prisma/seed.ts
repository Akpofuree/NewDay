import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // Only seed if no channels exist for this group
  // Default channels need a default group to attach to
  // Skip seeding channels here — they need a real groupId
  // Instead, create the first channel when a user creates their first group (handled in group creation logic)
  const existingGroups = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*) AS count FROM groups
  `;

  if (!existingGroups[0] || existingGroups[0].count === 0) {
    console.log(
      "No groups exist yet. The first channel will be created when a user creates a group.",
    );
  } else {
    console.log("Groups already exist; skipping channel seed.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
