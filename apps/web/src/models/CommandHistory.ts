import { z } from 'zod';

export const CommandSchema = z.object({
  command: z.string().min(1, 'Command is required'),
  timestamp: z.date().optional(),
  userId: z.string().optional(), // ユーザーIDは認証情報から取得
  // statusは必須フィールド（undefined不可）
  status: z.enum(['success', 'error', 'pending']),
  output: z.string().optional(),
  workingDirectory: z.string().optional(),
  environment: z.record(z.string()).optional(),
});

// Zodスキーマから型を自動生成して使用
export type Command = z.infer<typeof CommandSchema>;

// Firestoreのコレクションパスは奇数セグメントである必要がある
// histories/requests_eventsのように、偶数セグメントはエラーとなる
export const COMMAND_HISTORY_COLLECTION = 'command_history';
