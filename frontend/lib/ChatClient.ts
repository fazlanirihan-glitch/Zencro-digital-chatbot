export type StreamCallback = (chunk: string) => void;
export type MetadataCallback = (metadata: Record<string, unknown>) => void;
export type ErrorCallback = (error: Error) => void;

export interface ChatTransport {
  sendMessage(
    message: string,
    sessionId: string,
    onChunk: StreamCallback,
    onMetadata: MetadataCallback,
    onError: ErrorCallback,
    signal?: AbortSignal
  ): Promise<void>;
}

export class SSETransport implements ChatTransport {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async sendMessage(
    message: string,
    sessionId: string,
    onChunk: StreamCallback,
    onMetadata: MetadataCallback,
    onError: ErrorCallback,
    signal?: AbortSignal
  ): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          message,
          session_id: sessionId,
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // SSE lines are separated by \n\n
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || ''; // Keep the incomplete part in the buffer

        for (const part of parts) {
          if (!part.trim()) continue;

          // Parse event and data
          const lines = part.split('\n');
          let eventType = 'message';
          let dataStr = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.replace('event: ', '').trim();
            } else if (line.startsWith('data: ')) {
              dataStr = line.replace('data: ', '').trim();
            }
          }

          if (dataStr) {
            try {
              const parsed = JSON.parse(dataStr);
              if (eventType === 'message') {
                onChunk(parsed.chunk || '');
              } else if (eventType === 'metadata') {
                onMetadata(parsed);
              } else if (eventType === 'error') {
                onError(new Error(parsed.detail || 'Stream error'));
              }
            } catch {
              console.warn('Failed to parse SSE JSON data:', dataStr);
            }
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Handled silently or specifically
        throw error;
      }
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

// In the future, this can be swapped with WebSocketTransport
export class ChatClient {
  private transport: ChatTransport;

  constructor(transport: ChatTransport) {
    this.transport = transport;
  }

  async sendMessage(
    message: string,
    sessionId: string,
    onChunk: StreamCallback,
    onMetadata: MetadataCallback,
    onError: ErrorCallback,
    signal?: AbortSignal
  ): Promise<void> {
    return this.transport.sendMessage(message, sessionId, onChunk, onMetadata, onError, signal);
  }
}

// Singleton instance export
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const chatClient = new ChatClient(new SSETransport(API_BASE));
