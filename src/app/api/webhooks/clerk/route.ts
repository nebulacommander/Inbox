import { db } from "@/server/db";
import { Webhook } from '@clerk/nextjs/server';
import { headers } from 'next/headers';

export const POST = async (req: Request) => {
    const headerPayload = headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // Validate webhook payload
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Missing svix headers', { status: 400 });
    }

    const payload = await req.json();
    
    try {
        const { data } = payload;
        
        // Ensure required data exists
        if (!data || !data.id) {
            return new Response('Invalid webhook payload', { status: 400 });
        }

        // Safely access potentially undefined properties
        const emailAddress = data.email_addresses?.[0]?.email_address || null;
        const firstName = data.first_name || null;
        const lastName = data.last_name || null;
        const imageUrl = data.image_url || null;
        const id = data.id;

        await db.user.upsert({
            where: { id },
            update: { 
                emailAddress, 
                firstName, 
                lastName, 
                imageUrl 
            },
            create: { 
                id, 
                emailAddress, 
                firstName, 
                lastName, 
                imageUrl 
            },
        });

        return new Response('Webhook processed successfully', { status: 200 });
    } catch (error) {
        console.error('Error processing webhook:', error);
        return new Response('Error processing webhook', { status: 500 });
    }
}