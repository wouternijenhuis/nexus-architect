/**
 * Prisma seed script — populates the database with development data.
 *
 * Usage: npx prisma db seed
 */

import { PrismaClient } from '../src/generated/prisma/client.js'

// @ts-expect-error Prisma v7 generated client type
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'developer@nexus-architect.dev' },
    update: {},
    create: {
      email: 'developer@nexus-architect.dev',
      displayName: 'Dev User',
      role: 'admin',
    },
  })
  console.log(`  Created user: ${user.displayName} (${user.id})`)

  // Create demo project
  const project = await prisma.project.upsert({
    where: { id: 'demo-project-001' },
    update: {},
    create: {
      id: 'demo-project-001',
      name: 'Demo Project',
      description: 'A sample project for development',
      ownerId: user.id,
    },
  })
  console.log(`  Created project: ${project.name} (${project.id})`)

  // Create demo schema
  const schema = await prisma.schema.upsert({
    where: { id: 'demo-schema-001' },
    update: {},
    create: {
      id: 'demo-schema-001',
      name: 'Person Schema',
      projectId: project.id,
      xsdContent: `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">
  <xs:element name="Person">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="FirstName" type="xs:string"/>
        <xs:element name="LastName" type="xs:string"/>
        <xs:element name="Email" type="xs:string"/>
        <xs:element name="Age" type="xs:integer" minOccurs="0"/>
      </xs:sequence>
      <xs:attribute name="id" type="xs:string" use="required"/>
    </xs:complexType>
  </xs:element>
</xs:schema>`,
    },
  })
  console.log(`  Created schema: ${schema.name} (${schema.id})`)

  console.log('Seeding complete.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
