import { createAgentUIStreamResponse } from 'ai';
import type { AgentRequest } from '../types';
import { createAgent } from '../utils/agent';
import { requireAuth } from '../middleware/auth';
import { trackEvent } from '../utils/usageTracking';

interface AgentRequestWithConversation extends AgentRequest {
  conversationId?: string;
  philosopherId?: string;
}

export const agent = {
  POST: async (req: Request) => {
    try {
      // Require authentication for agent endpoint
      const authResult = await requireAuth(req);
      if (authResult instanceof Response) return authResult;
      const { user, sessionId } = authResult;

      const body = (await req.json()) as AgentRequestWithConversation;

      if (!body.messages || !Array.isArray(body.messages)) {
        return new Response(
          JSON.stringify({
            error: "Missing or invalid 'messages' parameter",
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      if (body.messages.length === 0) {
        return new Response(
          JSON.stringify({
            error: 'Messages array cannot be empty',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const formattedMessages = body.messages.map((msg: any) => {
        if (msg.parts) {
          return {
            id: msg.id || crypto.randomUUID(),
            role: msg.role,
            parts: msg.parts,
          };
        }

        return {
          id: msg.id || crypto.randomUUID(),
          role: msg.role,
          parts: [{ type: 'text' as const, text: msg.content }],
        };
      });

      console.log(
        `[Agent] Creating agent with ${formattedMessages.length} messages${body.conversationId ? ` (conversation: ${body.conversationId})` : ''}${body.philosopherId ? ` (focused: ${body.philosopherId})` : ''}`
      );

      // Track message sent event
      const lastMessage = formattedMessages[formattedMessages.length - 1];
      if (lastMessage?.role === 'user') {
        await trackEvent(
          user.id,
          'message_sent',
          'chat',
          {
            conversationId: body.conversationId,
            philosopherId: body.philosopherId,
            messageLength: lastMessage.parts?.[0]?.text?.length || 0,
          },
          sessionId
        );
      }

      const agent = await createAgent(
        formattedMessages,
        user.id,
        body.conversationId,
        body.philosopherId
      );

      return createAgentUIStreamResponse({
        agent: agent as any,
        uiMessages: formattedMessages,
      });
    } catch (error) {
      console.error('[Agent] Stream error:', error);
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
