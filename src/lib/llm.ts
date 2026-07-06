import type { Agent } from '@mastra/core/agent';
import { readEnv } from './env.ts';

function isOpenAiLimitError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as {
    statusCode?: number;
    message?: string;
    provider?: string;
    cause?: { message?: string };
  };

  const message = `${maybeError.message ?? ''} ${maybeError.cause?.message ?? ''}`.toLowerCase();
  const isOpenAiProvider = (maybeError.provider ?? '').toLowerCase() === 'openai' || message.includes('openai');
  const isLimitStatus = maybeError.statusCode === 429;
  const isLimitMessage =
    message.includes('rate limit') ||
    message.includes('quota') ||
    message.includes('insufficient_quota') ||
    message.includes('too many requests');

  return (isOpenAiProvider && isLimitStatus) || (isOpenAiProvider && isLimitMessage) || isLimitStatus;
}

function hasGoogleFallbackKey(): boolean {
  const env = readEnv();
  return Boolean(env.GOOGLE_API_KEY || env.GOOGLE_GENERATIVE_AI_API_KEY);
}

export async function generateWithFallback(
  agent: Agent,
  fallbackAgent: Agent | undefined,
  prompt: string,
  options?: any,
): Promise<any> {
  try {
    return options ? await (agent.generate as any)(prompt, options) : await (agent.generate as any)(prompt);
  } catch (error) {
    if (!fallbackAgent || !hasGoogleFallbackKey() || !isOpenAiLimitError(error)) {
      throw error;
    }

    return options ? await (fallbackAgent.generate as any)(prompt, options) : await (fallbackAgent.generate as any)(prompt);
  }
}
