import { Response } from 'express';

export interface StreamHandlerOptions {
  dto: any;
  serviceMethod: (dto: any) => any;
  response: Response;
}

export async function handleStreamResponse(options: StreamHandlerOptions): Promise<boolean> {
  const { dto, serviceMethod, response } = options;

  if (dto.stream) {
    // Handle streaming
    const stream = serviceMethod(dto);
    
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders();
    
    try {
      for await (const chunk of stream) {
        response.write(`data: ${JSON.stringify({ type: 'text-delta', text: chunk })}\n\n`);
      }
      response.write(`data: [DONE]\n\n`);
      response.end();
    } catch (err) {
      console.error('Stream error:', err);
      response.end();
    }
    
    return true; // Indicates streaming was handled
  }
  
  return false; // Indicates regular response should be handled
} 