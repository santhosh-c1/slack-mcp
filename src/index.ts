import { FastMCP } from 'fastmcp';
import { WebClient } from '@slack/web-api';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

const server = new FastMCP({
    name: 'slack-mcp',
    version: '1.0.0',
});

server.addTool({
    name: 'slack_check_vacation_status',
    description: 'Check if a Slack user is on vacation based on their profile status',
    parameters: z.object({
        email: z.string().email(),
    }),
    execute: async ({ email }) => {
        try {
            // First, find the user by email
            const userResponse = await slackClient.users.lookupByEmail({
                email: email,
            });

            if (!userResponse.ok || !userResponse.user) {
                throw new Error(`User not found for email: ${email}`);
            }

            const userId = userResponse.user.id;

            // Get the user's profile
            const profileResponse = await slackClient.users.profile.get({
                user: userId,
            });

            if (!profileResponse.ok || !profileResponse.profile) {
                throw new Error(`Failed to get profile for user: ${email}`);
            }

            const statusText = profileResponse.profile.status_text?.toLowerCase() || '';
            const isOnVacation = statusText.includes('vacation') ||
                statusText.includes('out of office') ||
                statusText.includes('ooo');

            return JSON.stringify({
                email,
                isOnVacation,
            });
        } catch (error) {
            console.error('Error checking vacation status:', error);
            throw error;
        }
    },
});

// Set up event handlers
server.on('disconnect', () => {
    console.log(`Client disconnected`);
});

server.on('connect', () => {
    console.log(`Client connected`);
});

// Handle process termination signals for graceful shutdown
const shutdown = () => {
    console.log('Shutting down gracefully...');
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('uncaughtException', (error) => {
    // Log but don't crash on unhandled errors
    console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    // Check if the error is related to the "Not connected" ping issue
    const errorString = String(reason);
    if (errorString.includes('Not connected') && errorString.includes('ping')) {
        // Silently ignore ping failures as they're expected in some situations
        return;
    }

    // Handle MCP connection closure errors
    if (errorString.includes('Connection closed') &&
        errorString.includes('MCP error -32000')) {
        // These are expected when clients disconnect, so we'll just log at debug level
        console.debug('Client disconnected (MCP connection closed)');
        return;
    }

    // Log other unhandled rejections
    console.error('Unhandled rejection:', reason);
});

// Start the server
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
console.log('Starting MCP server on port', port);
server.start({
    transportType: 'sse',
    sse: {
        endpoint: '/sse',
        port,
    },
});