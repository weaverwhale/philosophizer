/**
 * Transform reasoning chunks from LM Studio's delta.reasoning format
 * into content with <reasoning> tags that our frontend can extract and display.
 *
 * This middleware converts OpenAI-compatible reasoning responses into a format
 * compatible with our frontend's reasoning block display.
 */
export function transformReasoningToContent(response: Response): Response {
  if (!response.body) return response;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';
  let inReasoningBlock = false;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              if (data === '[DONE]') {
                // Close reasoning block before [DONE] if still open
                if (inReasoningBlock) {
                  const closeChunk = {
                    id: 'reasoning-close',
                    choices: [{ delta: { content: '</reasoning>' }, index: 0 }],
                  };
                  const closeLine =
                    'data: ' + JSON.stringify(closeChunk) + '\n\n';
                  controller.enqueue(encoder.encode(closeLine));
                  inReasoningBlock = false;
                }
                // Now send the [DONE]
                controller.enqueue(encoder.encode(line + '\n'));
                continue;
              }

              if (data !== '[DONE]') {
                try {
                  const parsed = JSON.parse(data);

                  // Transform reasoning into content with special tags
                  if (parsed.choices?.[0]?.delta?.reasoning) {
                    const reasoningText = parsed.choices[0].delta.reasoning;

                    // Add opening tag on first reasoning chunk
                    if (!inReasoningBlock) {
                      parsed.choices[0].delta.content = `<reasoning>${reasoningText}`;
                      inReasoningBlock = true;
                    } else {
                      // Just add the text for subsequent chunks
                      parsed.choices[0].delta.content = reasoningText;
                    }

                    const modifiedLine =
                      'data: ' + JSON.stringify(parsed) + '\n';
                    controller.enqueue(encoder.encode(modifiedLine));
                    continue;
                  }

                  // If we were in a reasoning block and now we're not, close it
                  if (inReasoningBlock && parsed.choices?.[0]?.delta?.content) {
                    parsed.choices[0].delta.content = `</reasoning>${parsed.choices[0].delta.content}`;
                    inReasoningBlock = false;

                    const modifiedLine =
                      'data: ' + JSON.stringify(parsed) + '\n';
                    controller.enqueue(encoder.encode(modifiedLine));
                    continue;
                  }
                } catch (e) {
                  // Not JSON, pass through
                }
              }
            }

            controller.enqueue(encoder.encode(line + '\n'));
          }
        }

        if (buffer) {
          controller.enqueue(encoder.encode(buffer));
        }

        controller.close();
      } catch (error) {
        // Check if this is an abort error
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('[ReasoningTransform] Stream aborted by client');
        }
        controller.error(error);
      }
    },
    cancel() {
      // Clean up the reader when stream is cancelled
      reader.cancel();
    },
  });

  return new Response(stream, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  });
}
