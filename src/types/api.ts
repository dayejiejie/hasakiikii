import { ChatCompletionMessageParam, ChatCompletionContentPart } from 'openai/resources/chat/completions';

export type MessageContent = ChatCompletionContentPart;

export type APIMessage = ChatCompletionMessageParam; 