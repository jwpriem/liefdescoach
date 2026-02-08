/**
 * Debug script to check health collection setup on PRODUCTION database
 * 
 * Usage:
 *   yarn tsx scripts/debug-health-prd.ts
 */

import 'dotenv/config'
import { Client, Databases, Query, ID } from 'node-appwrite'

async function main() {
    // Production database credentials (from .env commented lines)
    const project = '65b3ba2c71d21e4ec795'
    const apiKey = 'fda74649d2c27a1743cdc4c4c110e29b6a46770f7f599f4ddea43a3c1be8502380c9b3272497c27cf71210f5c5896a081ab3e840e6b6567aeaec4292a1c32d3379fe4ae0ff9b80c5125512e6c3542bb617d09dd86fe755bec24c259f2a58ab3f612297808ee394e32523cbba24850e29a9008b5b40720c42d5910774fbc1f833'
    const dbId = '65b3bab2bf0b4f357f4b'

    if (!project || !apiKey || !dbId) {
        console.error('Missing credentials')
        process.exit(1)
    }

    const client = new Client()
        .setEndpoint('https://cloud.appwrite.io/v1')
        .setProject(project)
        .setKey(apiKey)

    const databases = new Databases(client)

    console.log(`Using PRODUCTION database: ${dbId}`)

    // 1. Check health collection attributes
    console.log('\n=== Health Collection Attributes ===')
    try {
        const healthCollection = await databases.getCollection(dbId, 'health')
        console.log('Collection found:', healthCollection.name)

        const attrs = await databases.listAttributes(dbId, 'health')
        console.log('\nAttributes:')
        for (const attr of attrs.attributes) {
            const a = attr as any
            console.log(`  - ${a.key}: ${a.type}${a.relatedCollection ? ` (relation to ${a.relatedCollection})` : ''}`)
            if (a.relatedCollection) {
                console.log(`      Full config:`, JSON.stringify(a, null, 6))
            }
        }
    } catch (e: any) {
        console.error('Error getting health collection:', e.message)
    }

    // 2. Check students collection attributes
    console.log('\n=== Students Collection Attributes ===')
    try {
        const studentsCollection = await databases.getCollection(dbId, 'students')
        console.log('Collection found:', studentsCollection.name)

        const attrs = await databases.listAttributes(dbId, 'students')
        console.log('\nAttributes:')
        for (const attr of attrs.attributes) {
            const a = attr as any
            console.log(`  - ${a.key}: ${a.type}${a.relatedCollection ? ` (relation to ${a.relatedCollection})` : ''}`)
            if (a.relatedCollection) {
                console.log(`      twoWay: ${a.twoWay}, twoWayKey: ${a.twoWayKey}, side: ${a.side}`)
            }
        }
    } catch (e: any) {
        console.error('Error getting students collection:', e.message)
    }

    // 3. Check if a student document exists
    console.log('\n=== Sample Student Document ===')
    try {
        const students = await databases.listDocuments(dbId, 'students', [Query.limit(1)])
        if (students.documents.length > 0) {
            const student = students.documents[0]
            console.log('Student ID:', student.$id)
            console.log('Student data:', JSON.stringify(student, null, 2))
        } else {
            console.log('No students found!')
        }
    } catch (e: any) {
        console.error('Error listing students:', e.message)
    }

    // 4. Check health documents
    console.log('\n=== Sample Health Document ===')
    try {
        const health = await databases.listDocuments(dbId, 'health', [Query.limit(1)])
        if (health.documents.length > 0) {
            const h = health.documents[0]
            console.log('Health doc:', JSON.stringify(h, null, 2))
        } else {
            console.log('No health documents found!')
        }
    } catch (e: any) {
        console.error('Error listing health:', e.message)
    }

    // 5. Test creating a health document for the first student
    console.log('\n=== Test Create Health Document ===')
    try {
        const students = await databases.listDocuments(dbId, 'students', [Query.limit(1)])
        if (students.documents.length > 0) {
            const studentId = students.documents[0].$id
            console.log(`Attempting to create health doc for student: ${studentId}`)

            const testData = {
                injury: 'Test injury PRD',
                pregnancy: false,
                dueDate: null as any,
                student: studentId
            }
            console.log('Test data:', JSON.stringify(testData, null, 2))

            // First check if exists
            const existing = await databases.listDocuments(dbId, 'health', [
                Query.equal('student', [studentId]),
                Query.limit(1)
            ])

            if (existing.documents.length > 0) {
                console.log('Health doc already exists for this student')
            } else {
                console.log('\n--- Test: Create health, then link via students.health ---')
                try {
                    // Step 1: Create health doc WITHOUT student field
                    const testData = {
                        injury: 'Test injury via parent',
                        pregnancy: false,
                        dueDate: null as any
                    }
                    const healthResult = await databases.createDocument(dbId, 'health', ID.unique(), testData)
                    console.log('1. Created health doc:', healthResult.$id)

                    // Step 2: Link it from the parent side (students.health)
                    console.log('2. Linking via students.health...')
                    const studentResult = await databases.updateDocument(dbId, 'students', studentId, {
                        health: healthResult.$id
                    })
                    console.log('3. Linked successfully! Student health:', studentResult.health)

                    // Verify the back-reference
                    const verifyHealth = await databases.getDocument(dbId, 'health', healthResult.$id)
                    console.log('4. Verified health.student:', verifyHealth.student)

                    // Clean up
                    await databases.deleteDocument(dbId, 'health', healthResult.$id)
                    console.log('5. Cleaned up test doc')
                } catch (e: any) {
                    console.error('Test error:', e.message)
                    console.error('Error type:', e.type)
                }
            }
        }
    } catch (e: any) {
        console.error('Test create error:', e.message)
        console.error('Full error:', JSON.stringify(e, null, 2))
    }
}

main().catch(console.error)
