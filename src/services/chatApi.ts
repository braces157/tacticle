import type {
  ChatMessage,
  ChatThreadDetail,
  ChatThreadStatus,
  ChatThreadSummary,
} from "../types/domain";
import { apiRequest } from "./apiClient";

type CreateChatThreadRequest = {
  productSlug?: string;
  subject?: string;
};

export async function getChatThreads() {
  return (await apiRequest<ChatThreadSummary[]>("/chat/threads")) ?? [];
}

export async function getChatThreadDetail(threadId: string) {
  return (
    (await apiRequest<ChatThreadDetail>(
      `/chat/threads/${encodeURIComponent(threadId)}`,
      undefined,
      { allow404: true },
    )) ?? null
  );
}

export async function getProductChatThread(productSlug: string) {
  return (
    (await apiRequest<ChatThreadDetail>(
      `/chat/threads/product/${encodeURIComponent(productSlug)}`,
      undefined,
      { allow404: true },
    )) ?? null
  );
}

export async function createChatThread(request: CreateChatThreadRequest) {
  return (await apiRequest<ChatThreadSummary>("/chat/threads", {
    method: "POST",
    body: JSON.stringify(request),
  })) as ChatThreadSummary;
}

export async function sendChatMessage(threadId: string, body: string) {
  return (await apiRequest<ChatMessage>(`/chat/threads/${encodeURIComponent(threadId)}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  })) as ChatMessage;
}

export async function getAdminChatThreads() {
  return (await apiRequest<ChatThreadSummary[]>("/admin/chat/threads")) ?? [];
}

export async function getAdminChatThreadDetail(threadId: string) {
  return (
    (await apiRequest<ChatThreadDetail>(
      `/admin/chat/threads/${encodeURIComponent(threadId)}`,
      undefined,
      { allow404: true },
    )) ?? null
  );
}

export async function updateAdminChatThreadStatus(
  threadId: string,
  status: ChatThreadStatus,
) {
  return (await apiRequest<ChatThreadSummary>(`/admin/chat/threads/${encodeURIComponent(threadId)}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  })) as ChatThreadSummary;
}
