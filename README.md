# Slack Vacation Status MCP Server

This MCP server provides a tool to check if a Slack user is on vacation based on their profile status.

## Setup

1. Install dependencies:
```bash
yarn install
```

2. Create a Slack Bot:
   - Go to https://api.slack.com/apps
   - Create a new app
   - Add the following bot token scopes:
     - `users:read`
     - `users:read.email`
     - `users.profile:read`
   - Install the app to your workspace
   - Copy the Bot User OAuth Token

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Set your `SLACK_BOT_TOKEN` in the `.env` file

## Running the Server

Run server:
```bash
yarn start
```

In another terminal, inspect the MCP server:
```bash
yarn inspect
```

## API

The server provides one tool:

### check_vacation_status

Checks if a Slack user is on vacation based on their profile status.

Input:
```json
{
  "email": "user@example.com"
}
```

Output:
```json
{
  "email": "user@example.com",
  "isOnVacation": true
}
```

The tool considers a user to be on vacation if their status text contains any of these phrases:
- "vacation"
- "out of office"
- "ooo" 