import { type QueryConstraint, getFirestore, onSnapshot, query } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import type { z } from 'zod';
import {
  type FirestoreDocument,
  createEventCollectionFactory,
  getLatestEntityState,
} from '../../utils/firestore';

/**
 * Reactフック: イベントソーシングパターンに基づくコレクションの取得と監視
 * @param collectionName Firestoreコレクション名
 * @param schema エンティティのZodスキーマ
 * @param constraints オプションのクエリ制約
 * @returns エンティティのコレクション、ローディング状態、エラー状態、更新関数
 */
export function useFirestoreCollection<T>(
  collectionName: string,
  schema: z.ZodType<T>,
  constraints: QueryConstraint[] = []
) {
  const [entities, setEntities] = useState<FirestoreDocument<T>[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // 制約を直接使用するuseCallbackは、制約を変更しない限り安全
  const refreshCollection = useCallback(async () => {
    try {
      setLoading(true);
      const db = getFirestore();

      // create イベント用のコレクション作成
      const createEventsCollection = createEventCollectionFactory<T, 'create'>(
        collectionName,
        schema
      );

      // すべてのcreateイベントを取得してエンティティIDを取得
      const createEventsQuery = query(createEventsCollection.ref(db), ...constraints);

      // エンティティIDをすべて取得してサブスクリプション設定
      const createSnapshot = await onSnapshot(
        createEventsQuery,
        async (snapshot) => {
          try {
            const entityIds = snapshot.docs.map((doc) => doc.data().entityId);

            // 一般的なイベントコレクションの作成
            const allEventsCollection = createEventCollectionFactory(collectionName, schema);

            // 各エンティティの最新状態を取得
            const entityPromises = entityIds.map((id) =>
              getLatestEntityState(db, allEventsCollection, id)
            );

            const results = await Promise.all(entityPromises);
            // nullの値を除外して期待される型にキャスト
            const validEntities: FirestoreDocument<T>[] = [];
            for (const entity of results) {
              if (entity !== null) {
                validEntities.push(entity);
              }
            }

            setEntities(validEntities);
            setLoading(false);
            setError(null);
          } catch (err) {
            console.error('Error loading collection:', err);
            setError(err as Error);
            setLoading(false);
          }
        },
        (err) => {
          console.error('Error in collection subscription:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => createSnapshot();
    } catch (err) {
      console.error('Error setting up collection listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [collectionName, schema, constraints]);

  useEffect(() => {
    const unsubscribePromise = refreshCollection();
    let unsubscribe: (() => void) | undefined;

    // Promiseを適切に処理
    unsubscribePromise
      .then((unsub: (() => void) | undefined) => {
        unsubscribe = unsub;
      })
      .catch((err: Error) => console.error('Error setting up unsubscribe:', err));

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [refreshCollection]);

  return { entities, loading, error, refresh: refreshCollection };
}
