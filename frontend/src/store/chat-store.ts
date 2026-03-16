"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type ChatMessage, type ConversationItem } from "@/components/repository";

interface ChatState {
  conversations: Record<string, ConversationItem[]>; // Keyed by repoId
  activeConversationId: string | null;

  // Actions
  setConversations: (repoId: string, convs: ConversationItem[]) => void;
  setActiveConversationId: (id: string | null) => void;
  addConversation: (repoId: string, conv: ConversationItem) => void;
  updateConversation: (repoId: string, convId: string, updates: Partial<ConversationItem>) => void;
  updateMessage: (repoId: string, convId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  clearHistory: (repoId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: {},
      activeConversationId: null,

      setConversations: (repoId, convs) => 
        set((state) => ({
          conversations: { ...state.conversations, [repoId]: convs }
        })),

      setActiveConversationId: (id) => set({ activeConversationId: id }),

      addConversation: (repoId, conv) =>
        set((state) => {
          const repoConvs = state.conversations[repoId] || [];
          return {
            conversations: {
              ...state.conversations,
              [repoId]: [conv, ...repoConvs]
            },
            activeConversationId: conv.id
          };
        }),

      updateConversation: (repoId, convId, updates) =>
        set((state) => {
          const repoConvs = state.conversations[repoId] || [];
          return {
            conversations: {
              ...state.conversations,
              [repoId]: repoConvs.map((c) => (c.id === convId ? { ...c, ...updates } : c))
            }
          };
        }),

      updateMessage: (repoId, convId, messageId, updates) =>
        set((state) => {
          const repoConvs = state.conversations[repoId] || [];
          return {
            conversations: {
              ...state.conversations,
              [repoId]: repoConvs.map((c) =>
                c.id === convId
                  ? {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === messageId ? { ...m, ...updates } : m
                      )
                    }
                  : c
              )
            }
          };
        }),

      clearHistory: (repoId) =>
        set((state) => {
          const newConvs = { ...state.conversations };
          delete newConvs[repoId];
          return { conversations: newConvs, activeConversationId: null };
        }),
    }),
    {
      name: "repolens-chat-history",
    }
  )
);
