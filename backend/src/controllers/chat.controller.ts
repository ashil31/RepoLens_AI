import { Request, Response, NextFunction } from "express";
import { ChatService } from "../services/chat.service";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/appError";

export const chatWithRepoHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const repoId = req.params.repoId as string;
        const { message, history, messageId: clientMessageId } = req.body;

        if (!message) {
            return next(new AppError("Message is required", 400));
        }

        console.log(`[ChatController] Initializing chat for repo: ${repoId}`);

        const messageId = clientMessageId || `msg-${Date.now()}`;

        // Set headers for SSE (before any async work so we can emit during processing)
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const emit = (event: object) => res.write(`data: ${JSON.stringify(event)}\n\n`);

        try {
            const { stream } = await ChatService.processChat(repoId, message, history || [], messageId, emit);

            // Stream the answer chunks
            const reader = stream.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith("data:")) continue;

                    const data = trimmed.replace("data: ", "");
                    if (data === "[DONE]") {
                        res.write(`data: [DONE]\n\n`);
                        continue;
                    }

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content || "";
                        if (content) {
                            res.write(`data: ${JSON.stringify({ id: messageId, type: "content", data: content })}\n\n`);
                        }
                    } catch (e) {
                        // Ignore parse errors for partial lines
                    }
                }
            }

            emit({ id: messageId, type: "step", step: "generating", status: "done" });
            emit({ id: messageId, type: "done" });
            res.end();
            console.log(`[ChatController] Chat stream completed for repo: ${repoId}`);
        } catch (error: any) {
            console.error(`[ChatController] Error:`, error.message);
            res.write(`data: ${JSON.stringify({ id: messageId, type: "error", data: error.message })}\n\n`);
            res.end();
        }
    }
);
