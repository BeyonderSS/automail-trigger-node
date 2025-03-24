import "dotenv/config";  // Load environment variables
import { createClerkClient } from '@clerk/backend';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export default clerkClient;
