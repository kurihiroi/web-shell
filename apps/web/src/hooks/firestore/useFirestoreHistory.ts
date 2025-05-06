import { getFirestore, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { z } from 'zod';
import { type EventDocument, createEventCollectionFactory } from '../../firebase/firestore';

/**
 * Reactフック: エンティティの履歴（イベント履歴）を取得して監視
 * @param collectionName Firestoreコレクション名
 * @param schema エンティティのZodスキーマ
 * @param id エンティティID（nullの場合は未取得）
 * @returns エンティティの履歴、ローディング状態、エラー状態
 */
export function useFirestoreHistory<T>(
  collectionName: string,
  schema: z.ZodType<T>,
  id: string | null
) {
  const [history, setHistory] = useState<EventDocument<unknown>[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const db = getFirestore();

    // イベントコレクションの作成
    const eventsCollection = createEventCollectionFactory(collectionName, schema);

    // このエンティティのすべてのイベントを取得するクエリ
    const q = query(
      eventsCollection.ref(db),
      where('entityId', '==', id),
      orderBy('clientTimestamp')
    );

    // イベントの変更を監視
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const events = snapshot.docs.map((doc) => doc.data());
        setHistory(events);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error in history subscription:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, id, schema]);

  return { history, loading, error };
}
