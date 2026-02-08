
import { Client, Databases } from 'node-appwrite'
import dotenv from 'dotenv'

dotenv.config()

// --- Configuration ---
// Use PRD env vars if available, otherwise fall back to standard (or error)
const PROJECT = process.env.NUXT_PUBLIC_PROJECT_PRD || process.env.NUXT_PUBLIC_PROJECT
const API_KEY = process.env.NUXT_APPWRITE_KEY_PRD || process.env.NUXT_APPWRITE_KEY
const DB_ID = process.env.NUXT_PUBLIC_DATABASE_PRD || process.env.NUXT_PUBLIC_DATABASE

if (!PROJECT || !API_KEY || !DB_ID) {
    console.error('Error: Missing required environment variables (NUXT_PUBLIC_PROJECT_PRD, NUXT_APPWRITE_KEY_PRD, NUXT_PUBLIC_DATABASE_PRD)')
    process.exit(1)
}

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(PROJECT)
    .setKey(API_KEY)

const databases = new Databases(client)

// --- Expected Schema Definition (from setup-database.ts) ---
const EXPECTED_SCHEMA: any = {
    lessons: {
        attributes: {
            date: { type: 'datetime', required: true, array: false },
            type: { type: 'string', required: false, array: false, size: 255 },
            teacher: { type: 'string', required: false, array: false, size: 255 },
            bookings: { type: 'relationship', relationType: 'oneToMany', relatedCollection: 'bookings' }
        }
    },
    students: {
        attributes: {
            name: { type: 'string', required: true, array: false, size: 255 },
            email: { type: 'email', required: true, array: false },
            bookings: { type: 'relationship', relationType: 'oneToMany', relatedCollection: 'bookings' },
            // health is added by setup-health-db.ts, so we might see it as "extra" or just include it as optional here to avoid noise
            health: { type: 'relationship', relationType: 'oneToOne', relatedCollection: 'health', optional: true }
        }
    },
    bookings: {
        attributes: {
            lessons: { type: 'relationship', relationType: 'manyToOne', relatedCollection: 'lessons' },
            students: { type: 'relationship', relationType: 'manyToOne', relatedCollection: 'students' }
        }
    },
    credits: {
        attributes: {
            studentId: { type: 'string', required: true, array: false, size: 255 },
            bookingId: { type: 'string', required: false, array: false, size: 255 },
            type: { type: 'string', required: true, array: false, format: 'enum' }, // enum is string with format enum in some views, but type is string
            validFrom: { type: 'datetime', required: true, array: false },
            validTo: { type: 'datetime', required: true, array: false },
            createdAt: { type: 'datetime', required: true, array: false },
            usedAt: { type: 'datetime', required: false, array: false }
        },
        indexes: [
            { key: 'idx_studentId', type: 'key', attributes: ['studentId'] },
            { key: 'idx_bookingId', type: 'key', attributes: ['bookingId'] },
            { key: 'idx_student_available', type: 'key', attributes: ['studentId', 'bookingId', 'validTo'] }
        ]
    },
    health: {
        attributes: {
            injury: { type: 'string', required: false, array: false, size: 1000 },
            pregnancy: { type: 'boolean', required: false, array: false },
            dueDate: { type: 'datetime', required: false, array: false },
            student: { type: 'relationship', relationType: 'oneToOne', relatedCollection: 'students' }
        }
    }
}

async function verify() {
    console.log(`Verifying Schema for DB: ${DB_ID} (Project: ${PROJECT})`)
    console.log('---------------------------------------------------')

    let hasErrors = false

    for (const [colName, expected] of Object.entries(EXPECTED_SCHEMA)) {
        console.log(`\nChecking Collection: ${colName}`)
        try {
            // Check if collection exists
            // We use name matching or ID matching? usually ID matches name in setup script
            // setup-database.ts uses name as ID: databases.createCollection(dbId, 'lessons', 'lessons')
            const col = await databases.getCollection(DB_ID, colName)
            console.log(`✅ Collection exists: ${colName}`)

            // Fetch attributes
            const attrsList = await databases.listAttributes(DB_ID, colName)
            const actualAttrs = new Map(attrsList.attributes.map((a: any) => [a.key, a]))

            // Verify Expected Attributes
            for (const [attrKey, expectedConfig] of Object.entries(expected.attributes)) {
                const config = expectedConfig as any
                const actual = actualAttrs.get(attrKey)

                if (!actual) {
                    if (config.optional) {
                        console.log(`⚠️  Optional attribute missing: ${attrKey}`)
                    } else {
                        console.error(`❌ Missing Attribute: ${attrKey}`)
                        hasErrors = true
                    }
                    continue
                }

                // Check type
                if (actual.type !== config.type) {
                    console.error(`❌ Attribute Type Mismatch: ${attrKey} (Expected ${config.type}, got ${actual.type})`)
                    hasErrors = true
                } else {
                    // Detailed checks (required, array, size)
                    let mismatch = []
                    if (config.required !== undefined && actual.required !== config.required) mismatch.push(`required: ${actual.required} vs ${config.required}`)
                    if (config.array !== undefined && actual.array !== config.array) mismatch.push(`array: ${actual.array} vs ${config.array}`)
                    // relationship checks
                    if (config.type === 'relationship') {
                        let valid = false
                        if (actual.relationType === config.relationType) {
                            valid = true
                        } else if (config.relationType === 'manyToOne' && actual.relationType === 'oneToMany' && actual.side === 'child') {
                            // Appwrite represents ManyToOne (from child perspective) as OneToMany with side=child
                            valid = true
                        } else if (config.relationType === 'oneToMany' && actual.relationType === 'oneToMany' && actual.side === 'parent') {
                            valid = true
                        }

                        if (!valid) mismatch.push(`relationType: ${actual.relationType} (${actual.side}) vs ${config.relationType}`)
                        if (actual.relatedCollection !== config.relatedCollection) mismatch.push(`relatedCollection: ${actual.relatedCollection} vs ${config.relatedCollection}`)
                    }

                    if (mismatch.length > 0) {
                        console.error(`❌ Attribute Mismatch: ${attrKey} -> ${mismatch.join(', ')}`)
                        hasErrors = true
                    } else {
                        console.log(`✅ Attribute matches: ${attrKey}`)
                    }
                }

                // Mark as checked
                actualAttrs.delete(attrKey)
            }

            // Report Extra Attributes
            if (actualAttrs.size > 0) {
                console.log(`ℹ️  Extra Attributes found: ${Array.from(actualAttrs.keys()).join(', ')}`)
            }

            // Verify Indexes (if any)
            if (expected.indexes) {
                const indexesList = await databases.listIndexes(DB_ID, colName)
                const actualIndexes = new Map(indexesList.indexes.map((i: any) => [i.key, i]))

                for (const idx of expected.indexes) {
                    const actualIdx = actualIndexes.get(idx.key)
                    if (!actualIdx) {
                        console.error(`❌ Missing Index: ${idx.key}`)
                        hasErrors = true
                        continue
                    }
                    // Check attributes
                    const expectedAttrs = idx.attributes.sort().join(',')
                    const actualAttrs = actualIdx.attributes.sort().join(',')
                    if (expectedAttrs !== actualAttrs) {
                        console.error(`❌ Index Mismatch: ${idx.key} (Attributes: ${actualAttrs} vs ${expectedAttrs})`)
                        hasErrors = true
                    } else {
                        console.log(`✅ Index matches: ${idx.key}`)
                    }
                }
            }

        } catch (e: any) {
            if (e.code === 404) {
                console.error(`❌ Missing Collection: ${colName}`)
                hasErrors = true
            } else {
                console.error(`Error checking ${colName}:`, e.message)
            }
        }
    }

    console.log('\n---------------------------------------------------')
    if (hasErrors) {
        console.log('🔴 Verification Failed with errors.')
        process.exit(1)
    } else {
        console.log('🟢 Verification Passed!')
    }
}

verify().catch(console.error)
