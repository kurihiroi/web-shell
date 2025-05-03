import {
  EventCollection,
  type EventDocument,
  type FirestoreDocument,
  createEventCollectionFactory,
  getLatestEntityState,
} from '@web-shell/firestore-generator';
import {
  Firestore,
  type QueryConstraint,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { DependencyList, useCallback, useEffect, useState } from 'react';
import type { z } from 'zod';

export function useEventSourcedEntity<T>(
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

    // Create event collection
    const eventsCollection = createEventCollectionFactory(collectionName, schema);

    // Query for all events for this entity
    const q = query(
      eventsCollection.ref(db),
      where('entityId', '==', id),
      orderBy('clientTimestamp')
    );

    // Listen for changes to the events
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          // Reconstruct entity from events
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

export function useEntityHistory<T>(
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

    // Create event collection
    const eventsCollection = createEventCollectionFactory(collectionName, schema);

    // Query for all events for this entity
    const q = query(
      eventsCollection.ref(db),
      where('entityId', '==', id),
      orderBy('clientTimestamp')
    );

    // Listen for changes to the events
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

export function useEventSourcedCollection<T>(
  collectionName: string,
  schema: z.ZodType<T>,
  constraints: QueryConstraint[] = []
) {
  const [entities, setEntities] = useState<FirestoreDocument<T>[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // We use useCallback with constraints directly, which is safe because we're not modifying them
  const refreshCollection = useCallback(async () => {
    try {
      setLoading(true);
      const db = getFirestore();

      // Create event collection for create events
      const createEventsCollection = createEventCollectionFactory<T, 'create'>(
        collectionName,
        schema
      );

      // Query for all create events to get entity IDs
      const createEventsQuery = query(createEventsCollection.ref(db), ...constraints);

      // Get all entity IDs
      const createSnapshot = await onSnapshot(
        createEventsQuery,
        async (snapshot) => {
          try {
            const entityIds = snapshot.docs.map((doc) => doc.data().entityId);

            // Create generic events collection
            const allEventsCollection = createEventCollectionFactory(collectionName, schema);

            // Get latest state for each entity
            const entityPromises = entityIds.map((id) =>
              getLatestEntityState(db, allEventsCollection, id)
            );

            const results = await Promise.all(entityPromises);
            // Filter out null values and cast to the expected type
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

    // Handle the promise properly
    unsubscribePromise
      .then((unsub) => {
        unsubscribe = unsub;
      })
      .catch((err) => console.error('Error setting up unsubscribe:', err));

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [refreshCollection]);

  return { entities, loading, error, refresh: refreshCollection };
}
