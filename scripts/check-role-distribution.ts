import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type RoleCount = {
  professionalRole: string
  count: bigint
}

async function checkRoleDistribution() {
  const distribution = await prisma.$queryRaw<RoleCount[]>`
    SELECT "professionalRole", COUNT(*) as count
    FROM "Job"
    GROUP BY "professionalRole"
    ORDER BY count DESC;
  `

  console.log('\nProfessional Role Distribution:')
  console.log('==============================')
  
  const total = distribution.reduce((sum, role) => sum + Number(role.count), 0)
  
  distribution.forEach(role => {
    const count = Number(role.count)
    const percentage = ((count / total) * 100).toFixed(1)
    console.log(`${role.professionalRole}: ${count} jobs (${percentage}%)`)
  })
  
  console.log('\nTotal jobs:', total)
}

checkRoleDistribution()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  }) 