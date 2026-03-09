# Real-time Chat & Email Notifications Setup

## Overview
This document describes the implementation of real-time chat using Pusher and email notifications using Resend.

## 1. Real-time Chat with Pusher

### Installation
```bash
npm install pusher pusher-js
```

### Server-side Setup
- **File**: `src/lib/pusher.ts`
- **Purpose**: Server-side Pusher client for triggering events
- **Configuration**: Uses PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET, NEXT_PUBLIC_PUSHER_CLUSTER

### Client-side Setup
- **File**: `src/lib/pusher-client.ts`
- **Purpose**: Browser-side Pusher client for subscribing to events
- **Configuration**: Uses NEXT_PUBLIC_PUSHER_KEY, NEXT_PUBLIC_PUSHER_CLUSTER

### Integration Points

#### API Route: `src/app/api/chat/[roomId]/messages/route.ts`
- After saving a message to the database, triggers a Pusher event on channel `chat-${roomId}`
- Event name: `new-message`
- Payload includes: message id, content, senderId, sender info, createdAt
- Gracefully degrades if PUSHER_APP_ID is not set (no errors)

#### Chat Page: `src/app/(main)/chat/page.tsx`
- Subscribes to Pusher channel when activeRoom changes
- Listens for `new-message` events and appends to messages state
- Prevents duplicate messages with ID checking
- **Fallback**: If NEXT_PUBLIC_PUSHER_KEY is not set, falls back to 3-second polling
- Properly unsubscribes on cleanup to prevent memory leaks

### Benefits
- Real-time message delivery (no polling delay)
- Works on Vercel serverless (no WebSocket server needed)
- Automatic fallback to polling when Pusher is not configured

## 2. Email Notifications with Resend

### Installation
```bash
npm install resend
```

### Email Service Setup
- **File**: `src/lib/email.ts`
- **Purpose**: Unified email sending service
- **Configuration**: Uses RESEND_API_KEY, EMAIL_FROM
- **Graceful degradation**: Logs to console if API key is not set (no crashes)

### Email Templates
- **File**: `src/lib/email-templates.ts`
- **Templates**:
  1. `welcomeEmail(name)` - Sent on user registration
  2. `listingExpiredEmail(name, storeName)` - Sent when listing expires
  3. `newChatMessageEmail(name, senderName, listingName)` - Sent on new chat message
  4. `listingFavoritedEmail(name, storeName)` - Sent when someone favorites a listing

All templates use inline CSS for compatibility and include 권리샵 branding.

### Integration Points

#### 1. Welcome Email
- **File**: `src/lib/auth.ts`
- **Trigger**: NextAuth `createUser` event
- **Non-blocking**: Uses fire-and-forget pattern (async IIFE)
- **Sent to**: New user's email address

#### 2. Listing Expired Email
- **File**: `src/app/api/cron/expire-listings/route.ts`
- **Trigger**: Cron job runs (every day)
- **Non-blocking**: forEach with async IIFE
- **Sent to**: Listing owner's email
- **Context**: Includes listing name and link to manage listings

#### 3. New Chat Message Email
- **File**: `src/app/api/chat/[roomId]/messages/route.ts`
- **Trigger**: After message is saved and Pusher event is sent
- **Non-blocking**: Fire-and-forget (async IIFE)
- **Sent to**: The other participant in the chat
- **Context**: Includes sender name and listing name

#### 4. Listing Favorited Email
- **File**: `src/app/api/listings/[id]/favorite/route.ts`
- **Trigger**: When a user favorites a listing (not on unfavorite)
- **Non-blocking**: Fire-and-forget (async IIFE)
- **Sent to**: Listing owner
- **Context**: Includes listing name

### Email Best Practices
- All email sending is non-blocking (doesn't delay API responses)
- Error handling prevents crashes when email fails
- Logs all send attempts for debugging
- Graceful degradation when RESEND_API_KEY is not set

## 3. Environment Variables

Add to `.env`:

```bash
# Pusher (Real-time Chat)
PUSHER_APP_ID="your-app-id"
NEXT_PUBLIC_PUSHER_KEY="your-public-key"
PUSHER_SECRET="your-secret"
NEXT_PUBLIC_PUSHER_CLUSTER="ap3"

# Resend (Email)
RESEND_API_KEY="re_your_api_key"
EMAIL_FROM="권리샵 <noreply@kwonrishop.com>"
```

### Getting API Keys

#### Pusher
1. Sign up at https://pusher.com
2. Create a new Channels app
3. Choose cluster "ap3" (Asia Pacific - Seoul)
4. Copy App ID, Key, Secret from "App Keys" tab
5. Free tier: 200k messages/day, 100 concurrent connections

#### Resend
1. Sign up at https://resend.com
2. Verify your domain (or use resend.dev for testing)
3. Create an API key
4. Free tier: 100 emails/day, 3,000 emails/month

## 4. Testing

### Test Real-time Chat (Development)
1. Set up Pusher credentials in `.env.local`
2. Open two browser windows
3. Start a chat between two different users
4. Send a message in one window
5. Verify it appears instantly in the other window (no 3-second delay)

### Test Real-time Chat (Without Pusher)
1. Remove PUSHER_APP_ID from `.env.local`
2. Verify chat still works with 3-second polling
3. Check browser console for no errors

### Test Email Notifications (Development)
1. Set up Resend API key in `.env.local`
2. For welcome email: Create a new user account
3. For chat email: Send a chat message
4. For favorite email: Click favorite on a listing
5. For expired email: Run the cron endpoint manually
6. Check Resend dashboard for sent emails

### Test Email Notifications (Without Resend)
1. Remove RESEND_API_KEY from `.env.local`
2. Trigger various actions (signup, chat, favorite)
3. Verify no crashes occur
4. Check server logs show "[Email] Skipped" messages

## 5. Production Deployment

### Vercel Environment Variables
Add all environment variables in Vercel Dashboard → Settings → Environment Variables:
- PUSHER_APP_ID
- NEXT_PUBLIC_PUSHER_KEY (must have NEXT_PUBLIC_ prefix)
- PUSHER_SECRET
- NEXT_PUBLIC_PUSHER_CLUSTER
- RESEND_API_KEY
- EMAIL_FROM

### Domain Configuration (Resend)
1. Add your domain in Resend dashboard
2. Add DNS records (SPF, DKIM, DMARC) for deliverability
3. Verify domain
4. Update EMAIL_FROM to use your domain: "권리샵 <noreply@yourdomain.com>"

### Monitoring
- Pusher: Monitor usage in Pusher dashboard
- Resend: Monitor emails, bounces, complaints in Resend dashboard
- Check application logs for email/pusher errors

## 6. Architecture Decisions

### Why Pusher?
- Vercel is serverless (no persistent WebSocket server)
- Pusher provides managed real-time infrastructure
- Automatic scaling
- Built-in fallback mechanisms
- Free tier sufficient for initial launch

### Why Resend?
- Modern API (better than SendGrid, Mailgun for this use case)
- Excellent deliverability
- Simple setup
- Great developer experience
- React email templates supported (future enhancement)

### Why Fire-and-Forget for Emails?
- User experience: Don't delay API responses
- Reliability: Email failures shouldn't break the primary action
- Logging: All attempts are logged for debugging
- Retry: Resend has built-in retry mechanisms

## 7. Future Enhancements

### Real-time Chat
- [ ] Typing indicators
- [ ] Read receipts (beyond lastReadAt)
- [ ] Message reactions
- [ ] File sharing
- [ ] Voice messages

### Email Notifications
- [ ] User email preferences (opt-out)
- [ ] Digest emails (daily/weekly summaries)
- [ ] React Email templates for better design
- [ ] SMS notifications for critical events
- [ ] Push notifications (web push API)

## 8. Troubleshooting

### Real-time Chat Not Working
1. Check browser console for Pusher connection errors
2. Verify NEXT_PUBLIC_PUSHER_KEY is set correctly
3. Check Pusher dashboard for connection attempts
4. Verify firewall allows WebSocket connections
5. Check if cluster is correct (ap3 for Korea)

### Emails Not Sending
1. Check server logs for email errors
2. Verify RESEND_API_KEY is set
3. Check Resend dashboard for delivery status
4. Verify email addresses are valid
5. Check spam folder
6. Verify domain DNS records if using custom domain

### Performance Issues
1. Monitor Pusher channel subscriptions (unsubscribe on cleanup)
2. Check for memory leaks in chat component
3. Monitor email queue in Resend
4. Consider rate limiting for email notifications

## Summary
Both features are production-ready with graceful degradation, proper error handling, and no breaking changes to existing functionality. The implementation follows best practices for serverless environments and provides a solid foundation for future real-time and notification features.
