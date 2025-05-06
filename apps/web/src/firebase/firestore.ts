import { type DocumentData, type Firestore, collection, onSnapshot } from 'firebase/firestore';

/**
 * Represents the type of change that occurred in Firestore
 */
export type FirestoreChangeType = 'added' | 'modified' | 'removed';

/**
 * Represents a change event from Firestore
 */
export interface FirestoreChangeEvent<T = DocumentData> {
  type: FirestoreChangeType;
  id: string;
  data: T;
}

/**
 * Watches a Firestore collection for changes and triggers a callback function when changes occur.
 *
 * @param db - Firestore database instance
 * @param collectionPath - Path to the Firestore collection to watch
 * @param callback - Function that will be called with the change event containing type, id, and data
 * @returns An unsubscribe function that can be called to stop watching for changes
 */
export function watchCollection<T = DocumentData>(
  db: Firestore,
  collectionPath: string,
  callback: (event: FirestoreChangeEvent<T>) => void
): () => void {
  try {
    const collectionRef = collection(db, collectionPath);

    // Set up the snapshot listener and return the unsubscribe function
    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        // Process each change in the snapshot
        for (const change of snapshot.docChanges()) {
          const docData = change.doc.data() as T;
          const event: FirestoreChangeEvent<T> = {
            type: change.type as FirestoreChangeType, // 'added', 'modified', or 'removed'
            id: change.doc.id,
            data: docData,
          };

          callback(event);
        }
      },
      (error) => {
        console.error(`Error watching Firestore collection ${collectionPath}:`, error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error(`Failed to set up listener for collection ${collectionPath}:`, error);
    // Return a no-op unsubscribe function when an error occurs
    return () => {};
  }
}
