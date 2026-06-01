/**
 * Ambient type declarations for Vercel Serverless API dependencies.
 * These packages are only available in the Vercel runtime, not locally.
 * This file silences IDE errors without requiring a local install.
 */

declare module '@vercel/node' {
  import { IncomingMessage, ServerResponse } from 'http';

  export interface VercelRequest extends IncomingMessage {
    query: Record<string, string | string[]>;
    cookies: Record<string, string>;
    body: any;
  }

  export interface VercelResponse extends ServerResponse {
    status(code: number): VercelResponse;
    json(body: any): VercelResponse;
    send(body: any): VercelResponse;
    setHeader(name: string, value: string | string[]): this;
  }
}

declare module '@google/genai' {
  export interface GoogleGenAIOptions {
    apiKey: string;
  }

  export interface GenerateContentConfig {
    systemInstruction?: string;
    temperature?: number;
    responseMimeType?: string;
    responseSchema?: any;
  }

  export interface GenerateContentRequest {
    model: string;
    contents: string;
    config?: GenerateContentConfig;
  }

  export interface GenerateContentResponse {
    text?: string;
  }

  export class GoogleGenAI {
    constructor(options: GoogleGenAIOptions);
    models: {
      generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse>;
    };
  }
}
