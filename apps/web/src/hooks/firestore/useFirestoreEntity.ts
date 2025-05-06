import {
  type FirestoreDocument,
  createEventCollectionFactory,
  getLatestEntityState,
} from '@web-shell/firestore-generator';
import { getFirestore, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { z } from 'zod';

/**
 * Reactフック: イベントソーシングパターンに基づく単一エンティティの取得と監視
 * @param collectionName Firestoreコレクション名
 * @param schema エンティティのZodスキーマ
 * @param id エンティティID（nullの場合は未取得）
 * @returns エンティティの状態、ローディング状態、エラー状態
 */
export function useFirestoreEntity<T>(
  collectionName: string,
  schema: z.ZodType<T>,
  id: string | null
) {
  const [entity, setEntity] = useState<FirestoreDocument<T> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setEntity(null);
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
      async () => {
        try {
          // イベントからエンティティを再構築
          const latestState = await getLatestEntityState(db, eventsCollection, id);
          setEntity(latestState);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error('Error reconstructing entity:', err);
          setError(err as Error);
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error in entity subscription:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, id, schema]);

  return { entity, loading, error };
}
