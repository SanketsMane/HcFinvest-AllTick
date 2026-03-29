import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import emailService from '../services/emailService.js'

import mongoose from 'mongoose'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

async function testPostmark() {
    console.log('--- Postmark Integration Test ---')
    console.log('Provider:', process.env.EMAIL_PROVIDER)
    
    try {
        console.log('Connecting to MongoDB...')
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('MongoDB Connected.')

        console.log('Verifying connection...')
        const connection = await emailService.verifyConnection()
        console.log('Connection status:', connection)
        
        if (!connection.success) {
            console.error('Connection failed, aborting test.')
            return
        }

        console.log('Sending test email...')
        const result = await emailService.sendEmail({
            to: 'support@heddgecapitals.com',
            toName: 'HC Support Test',
            subject: 'Postmark Integration Test',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h1>Postmark Integration Successful!</h1>
                    <p>This is a test email sent from the HC-FINVEST backend using the new Postmark SDK integration.</p>
                    <hr/>
                    <p>Status: <strong>READY</strong></p>
                    <p>Timestamp: ${new Date().toISOString()}</p>
                </div>
            `,
            category: 'transactional'
        })

        console.log('Test result:', result)
        console.log('--- Test Complete ---')
        process.exit(0)
    } catch (error) {
        if (error.response) {
            console.error('Full Postmark Error:', error.response)
        }
        console.error('Test failed with message:', error.message)
        process.exit(1)
    }
}

testPostmark()
