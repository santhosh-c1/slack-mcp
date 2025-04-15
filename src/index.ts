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

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
console.log('Starting MCP server on port', port);
server.start({
    transportType: 'sse',
    sse: {
        endpoint: '/sse',
        port,
    },
});