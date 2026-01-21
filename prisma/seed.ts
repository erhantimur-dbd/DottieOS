import { PrismaClient, UserRole, AttendanceStatus, PaymentStatus, ConsentStatus, CommunicationChannel, DailyUpdateStatus, TaskCategory, TaskStatus, EvidenceStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.$transaction([
    prisma.outboundMessageLog.deleteMany(),
    prisma.dailyUpdateApproval.deleteMany(),
    prisma.dailyUpdate.deleteMany(),
    prisma.dailyNote.deleteMany(),
    prisma.evidenceAttachment.deleteMany(),
    prisma.evidenceItem.deleteMany(),
    prisma.task.deleteMany(),
    prisma.incidentLog.deleteMany(),
    prisma.consentRecord.deleteMany(),
    prisma.consentTemplate.deleteMany(),
    prisma.document.deleteMany(),
    prisma.paymentInvoice.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.childAssignment.deleteMany(),
    prisma.childGuardian.deleteMany(),
    prisma.guardian.deleteMany(),
    prisma.child.deleteMany(),
    prisma.user.deleteMany(),
    prisma.organisation.deleteMany(),
  ])

  // Create Organisation
  const org = await prisma.organisation.create({
    data: {
      name: "Sunshine Nursery",
      address: "123 Happy Lane, London, UK SW1A 1AA",
      email: "info@sunshine-nursery.co.uk",
      phone: "020 7946 0958",
      dailyUpdateScheduleTime: "17:00",
      dailyUpdateScheduleDays: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri"]),
      dailyUpdateDefaultApprover: "SUPERVISOR"
    }
  })

  console.log('✅ Created organisation: Sunshine Nursery')

  // Create Users
  const passwordHash = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      name: 'Sarah Johnson',
      passwordHash,
      role: UserRole.ADMIN,
      organisationId: org.id
    }
  })

  const supervisor = await prisma.user.create({
    data: {
      email: 'supervisor@demo.com',
      name: 'Mike Chen',
      passwordHash,
      role: UserRole.SUPERVISOR,
      organisationId: org.id
    }
  })

  const staff1 = await prisma.user.create({
    data: {
      email: 'staff1@demo.com',
      name: 'Emma Thompson',
      passwordHash,
      role: UserRole.STAFF,
      organisationId: org.id
    }
  })

  const staff2 = await prisma.user.create({
    data: {
      email: 'staff2@demo.com',
      name: 'David Wilson',
      passwordHash,
      role: UserRole.STAFF,
      organisationId: org.id
    }
  })

  console.log('✅ Created 4 users')

  // Create Children
  const children = await Promise.all([
    prisma.child.create({
      data: {
        firstName: 'Oliver',
        lastName: 'Smith',
        dateOfBirth: new Date('2021-03-15'),
        startDate: new Date('2024-01-10'),
        keyPersonId: staff1.id,
        room: 'Toddlers',
        dietaryNeeds: 'No nuts',
        medicalNotes: 'Asthma - inhaler in medical bag',
        organisationId: org.id,
        createdById: admin.id
      }
    }),
    prisma.child.create({
      data: {
        firstName: 'Amelia',
        lastName: 'Brown',
        dateOfBirth: new Date('2020-07-22'),
        startDate: new Date('2023-09-01'),
        keyPersonId: staff1.id,
        room: 'Pre-school',
        dietaryNeeds: 'Vegetarian',
        organisationId: org.id,
        createdById: admin.id
      }
    }),
    prisma.child.create({
      data: {
        firstName: 'Noah',
        lastName: 'Taylor',
        dateOfBirth: new Date('2021-11-08'),
        startDate: new Date('2024-02-01'),
        keyPersonId: staff2.id,
        room: 'Toddlers',
        organisationId: org.id,
        createdById: admin.id
      }
    }),
    prisma.child.create({
      data: {
        firstName: 'Isabella',
        lastName: 'Davies',
        dateOfBirth: new Date('2020-05-30'),
        startDate: new Date('2023-06-15'),
        keyPersonId: staff2.id,
        room: 'Pre-school',
        dietaryNeeds: 'Lactose intolerant',
        organisationId: org.id,
        createdById: admin.id
      }
    }),
    prisma.child.create({
      data: {
        firstName: 'Sophia',
        lastName: 'Evans',
        dateOfBirth: new Date('2021-09-12'),
        startDate: new Date('2024-01-08'),
        keyPersonId: staff1.id,
        room: 'Toddlers',
        organisationId: org.id,
        createdById: admin.id
      }
    }),
    prisma.child.create({
      data: {
        firstName: 'Jack',
        lastName: 'Roberts',
        dateOfBirth: new Date('2020-12-03'),
        startDate: new Date('2023-09-01'),
        keyPersonId: staff2.id,
        room: 'Pre-school',
        organisationId: org.id,
        createdById: admin.id
      }
    }),
    prisma.child.create({
      data: {
        firstName: 'Lily',
        lastName: 'Morgan',
        dateOfBirth: new Date('2021-04-18'),
        startDate: new Date('2024-02-15'),
        keyPersonId: staff1.id,
        room: 'Toddlers',
        medicalNotes: 'Eczema - cream in bag',
        organisationId: org.id,
        createdById: admin.id
      }
    }),
    prisma.child.create({
      data: {
        firstName: 'Harry',
        lastName: 'Williams',
        dateOfBirth: new Date('2020-08-25'),
        startDate: new Date('2023-10-01'),
        keyPersonId: staff2.id,
        room: 'Pre-school',
        organisationId: org.id,
        createdById: admin.id
      }
    })
  ])

  console.log('✅ Created 8 children')

  // Create Guardians and link to children
  const guardians = []

  for (let i = 0; i < children.length; i++) {
    const child = children[i]

    // Create 2 guardians per child
    const guardian1 = await prisma.guardian.create({
      data: {
        firstName: child.firstName + "'s",
        lastName: 'Mother',
        email: `mother${i + 1}@example.com`,
        phone: `07${Math.floor(Math.random() * 900000000 + 100000000)}`,
        relationship: 'Mother',
        pickupPermission: true,
        preferredChannel: i % 3 === 0 ? CommunicationChannel.WHATSAPP : CommunicationChannel.EMAIL,
        organisationId: org.id
      }
    })

    const guardian2 = await prisma.guardian.create({
      data: {
        firstName: child.firstName + "'s",
        lastName: 'Father',
        email: i < 2 ? undefined : `father${i + 1}@example.com`, // First 2 missing email
        phone: `07${Math.floor(Math.random() * 900000000 + 100000000)}`,
        relationship: 'Father',
        pickupPermission: true,
        preferredChannel: CommunicationChannel.EMAIL,
        organisationId: org.id
      }
    })

    guardians.push(guardian1, guardian2)

    await prisma.childGuardian.createMany({
      data: [
        { childId: child.id, guardianId: guardian1.id, isPrimary: true },
        { childId: child.id, guardianId: guardian2.id, isPrimary: false }
      ]
    })
  }

  console.log('✅ Created 16 guardians and linked to children')

  // Create staff assignments
  for (const child of children) {
    if (child.keyPersonId) {
      await prisma.childAssignment.create({
        data: {
          childId: child.id,
          userId: child.keyPersonId
        }
      })
    }
  }

  console.log('✅ Created child assignments')

  // Create attendance records for the past week
  const daysAgo = 7
  for (let i = 0; i < daysAgo; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue

    for (const child of children) {
      await prisma.attendance.create({
        data: {
          childId: child.id,
          date,
          checkInTime: new Date(date.getTime() + 8 * 60 * 60 * 1000 + Math.random() * 60 * 60 * 1000),
          checkOutTime: i < 1 ? undefined : new Date(date.getTime() + 16 * 60 * 60 * 1000 + Math.random() * 2 * 60 * 60 * 1000),
          status: AttendanceStatus.PRESENT,
          organisationId: org.id
        }
      })
    }
  }

  console.log('✅ Created attendance records')

  // Create payment invoices (some overdue)
  for (let i = 0; i < children.length; i++) {
    const child = children[i]

    // Current month invoice
    await prisma.paymentInvoice.create({
      data: {
        childId: child.id,
        amount: 1200.00,
        dueDate: new Date(new Date().setDate(5)), // Due 5th of month
        status: i < 3 ? PaymentStatus.OVERDUE : PaymentStatus.UNPAID,
        description: 'Monthly childcare fee - January 2026',
        organisationId: org.id,
        createdById: admin.id
      }
    })

    // Previous month (paid)
    await prisma.paymentInvoice.create({
      data: {
        childId: child.id,
        amount: 1200.00,
        dueDate: new Date('2025-12-05'),
        paidDate: new Date('2025-12-03'),
        status: PaymentStatus.PAID,
        description: 'Monthly childcare fee - December 2025',
        organisationId: org.id,
        createdById: admin.id
      }
    })
  }

  console.log('✅ Created payment invoices')

  // Create consent templates
  const consentTemplates = await Promise.all([
    prisma.consentTemplate.create({
      data: {
        name: 'Photo Consent',
        description: 'Permission to take and use photographs',
        requiresExpiry: true,
        organisationId: org.id
      }
    }),
    prisma.consentTemplate.create({
      data: {
        name: 'Medical Consent',
        description: 'Permission to administer first aid and emergency medical treatment',
        requiresExpiry: true,
        organisationId: org.id
      }
    }),
    prisma.consentTemplate.create({
      data: {
        name: 'Outings Consent',
        description: 'Permission for local outings and trips',
        requiresExpiry: true,
        organisationId: org.id
      }
    }),
    prisma.consentTemplate.create({
      data: {
        name: 'Sun Cream Consent',
        description: 'Permission to apply sun cream',
        requiresExpiry: false,
        organisationId: org.id
      }
    })
  ])

  // Create consent records (some missing/expired)
  for (let i = 0; i < children.length; i++) {
    const child = children[i]

    for (let j = 0; j < consentTemplates.length; j++) {
      const template = consentTemplates[j]

      // Mix of statuses
      let status = ConsentStatus.SIGNED
      let signedDate: Date | undefined = new Date('2024-01-01')
      let expiryDate: Date | undefined

      if (template.requiresExpiry) {
        expiryDate = new Date('2026-12-31')
      }

      // Some missing consents
      if ((i + j) % 5 === 0) {
        status = ConsentStatus.MISSING
        signedDate = undefined
        expiryDate = undefined
      }

      // Some expired
      if ((i + j) % 7 === 0 && template.requiresExpiry) {
        status = ConsentStatus.EXPIRED
        expiryDate = new Date('2025-06-30')
      }

      await prisma.consentRecord.create({
        data: {
          childId: child.id,
          templateId: template.id,
          status,
          signedDate,
          expiryDate,
          organisationId: org.id,
          createdById: admin.id
        }
      })
    }
  }

  console.log('✅ Created consent records')

  // Create evidence items
  const evidenceCategories = [
    { name: 'Safeguarding Policy', category: 'Policies', status: EvidenceStatus.READY },
    { name: 'Health & Safety Policy', category: 'Policies', status: EvidenceStatus.READY },
    { name: 'Fire Safety Risk Assessment', category: 'Risk Assessments', status: EvidenceStatus.READY },
    { name: 'Food Hygiene Certificate', category: 'Training', status: EvidenceStatus.NOT_READY },
    { name: 'First Aid Training', category: 'Training', status: EvidenceStatus.READY },
    { name: 'DBS Checks - All Staff', category: 'Compliance', status: EvidenceStatus.NOT_READY },
    { name: 'Insurance Certificate', category: 'Compliance', status: EvidenceStatus.READY },
    { name: 'Building Maintenance Records', category: 'Premises', status: EvidenceStatus.NOT_READY }
  ]

  for (const item of evidenceCategories) {
    await prisma.evidenceItem.create({
      data: {
        ...item,
        organisationId: org.id,
        createdById: admin.id,
        lastReviewedAt: item.status === EvidenceStatus.READY ? new Date() : undefined
      }
    })
  }

  console.log('✅ Created evidence items')

  // Create tasks
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.task.createMany({
    data: [
      {
        title: 'Update fire safety risk assessment',
        description: 'Annual review due',
        dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
        category: TaskCategory.COMPLIANCE,
        status: TaskStatus.PENDING,
        assignedToId: admin.id,
        organisationId: org.id,
        createdById: supervisor.id
      },
      {
        title: 'Chase overdue payments',
        description: 'Send reminders for January invoices',
        dueDate: today,
        category: TaskCategory.FINANCE,
        status: TaskStatus.PENDING,
        assignedToId: admin.id,
        organisationId: org.id,
        createdById: admin.id
      },
      {
        title: 'Renew food hygiene certificate',
        description: 'Certificate expires next month',
        dueDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
        category: TaskCategory.COMPLIANCE,
        status: TaskStatus.IN_PROGRESS,
        assignedToId: supervisor.id,
        organisationId: org.id,
        createdById: admin.id
      }
    ]
  })

  console.log('✅ Created tasks')

  // Create daily notes and updates for today
  for (let i = 0; i < children.length; i++) {
    const child = children[i]

    const dailyNote = await prisma.dailyNote.create({
      data: {
        childId: child.id,
        date: today,
        wellbeing: i % 3 === 0 ? 'Happy and energetic' : i % 3 === 1 ? 'A bit tired today' : 'Very cheerful',
        meals: i % 2 === 0 ? 'Ate all breakfast and lunch' : 'Ate most of lunch, left some carrots',
        naps: i % 3 === 0 ? 'Slept 2 hours (12:30-14:30)' : i % 3 === 1 ? 'Short nap 45 minutes' : 'No nap today',
        toileting: i % 2 === 0 ? '3 successful toilet visits' : '2 nappy changes',
        activities: 'Painting, outdoor play, story time, building blocks',
        notableEvents: i === 0 ? 'Shared toys nicely with friends' : i === 1 ? 'Enjoyed singing session' : undefined,
        organisationId: org.id,
        createdById: child.keyPersonId || staff1.id
      }
    })

    // Create daily update with different statuses
    let updateStatus = DailyUpdateStatus.NEEDS_APPROVAL

    if (i < 3) {
      updateStatus = DailyUpdateStatus.APPROVED
    } else if (i === 3 || i === 4) {
      updateStatus = DailyUpdateStatus.NEEDS_APPROVAL
    } else {
      updateStatus = DailyUpdateStatus.DRAFT
    }

    const dailyUpdate = await prisma.dailyUpdate.create({
      data: {
        childId: child.id,
        date: today,
        status: updateStatus,
        compiledEmailContent: `Daily Update - ${child.firstName} ${child.lastName}\n\nWellbeing: ${dailyNote.wellbeing}\nMeals: ${dailyNote.meals}\nNaps: ${dailyNote.naps}\nActivities: ${dailyNote.activities}`,
        compiledWhatsAppContent: `${child.firstName}'s day:\n✓ ${dailyNote.wellbeing}\n✓ ${dailyNote.meals}\n✓ ${dailyNote.naps}\n✓ ${dailyNote.activities}`,
        sentAt: updateStatus === DailyUpdateStatus.SENT ? new Date() : undefined,
        organisationId: org.id
      }
    })

    // Create approval for approved updates
    if (updateStatus === DailyUpdateStatus.APPROVED) {
      await prisma.dailyUpdateApproval.create({
        data: {
          dailyUpdateId: dailyUpdate.id,
          approvedById: supervisor.id,
          approvedAt: new Date()
        }
      })
    }

    // Create approval tasks for updates needing approval
    if (updateStatus === DailyUpdateStatus.NEEDS_APPROVAL) {
      await prisma.task.create({
        data: {
          title: 'Approve daily update',
          description: `Approve daily update for ${child.firstName} ${child.lastName}`,
          dueDate: new Date(today.getTime() + 16 * 60 * 60 * 1000), // Due 4pm today
          linkedDate: today,
          category: TaskCategory.PARENT_UPDATES,
          status: TaskStatus.PENDING,
          childId: child.id,
          assignedToId: supervisor.id,
          organisationId: org.id,
          createdById: child.keyPersonId || staff1.id
        }
      })
    }
  }

  console.log('✅ Created daily notes and updates')

  console.log('🎉 Seeding completed successfully!')
  console.log('')
  console.log('Demo login credentials:')
  console.log('  Admin: admin@demo.com / admin123')
  console.log('  Supervisor: supervisor@demo.com / admin123')
  console.log('  Staff: staff1@demo.com / admin123')
  console.log('')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
