/**
 * Debug script to check health collection setup and test relationship
 * 
 * Usage:
 *   yarn tsx scripts/debug-health.ts
 */

import { createAppwriteClient, getDatabaseId } from './appwrite-client'

async function main() {
    const { databases, Query } = createAppwriteClient()
    const dbId = getDatabaseId()

    console.log(`Using database: ${dbId}`)

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
                console.log(`      twoWay: ${a.twoWay}, twoWayKey: ${a.twoWayKey}, side: ${a.side}`)
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
                injury: 'Test injury',
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
                console.log('Health doc already exists, trying update instead...')
                const testUpdate = {
                    injury: 'Test injury update',
                    pregnancy: false,
                    dueDate: null as any,
                    student: studentId
                }
                console.log('Update data:', JSON.stringify(testUpdate, null, 2))
                try {
                    const result = await databases.updateDocument(dbId, 'health', existing.documents[0].$id, testUpdate)
                    console.log('Updated successfully:', result.$id)
                } catch (updateErr: any) {
                    console.error('Update error:', updateErr.message)
                    console.error('Update error type:', updateErr.type)
                }
            } else {
                const { ID } = await import('node-appwrite')
                const result = await databases.createDocument(dbId, 'health', ID.unique(), testData)
                console.log('Created:', result.$id)
            }
        }
    } catch (e: any) {
        console.error('Test create error:', e.message)
        console.error('Full error:', JSON.stringify(e, null, 2))
    }
}

main().catch(console.error)
