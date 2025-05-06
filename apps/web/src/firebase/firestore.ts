import { type DocumentData, type Firestore, collection, onSnapshot } from 'firebase/firestore';
import { z } from 'zod';

/**
 * Zod schema for Firestore change type
 */
export const firestoreChangeTypeSchema = z.enum(['added', 'modified', 'removed']);

/**
 * Type inferred from the Zod schema
 */
export type FirestoreChangeType = z.infer<typeof firestoreChangeTypeSchema>;

/**
 * Zod schema for Firestore change event
 */
export const firestoreChangeEventSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    type: firestoreChangeTypeSchema,
    id: z.string(),
    data: dataSchema,
  });

/**
 * Type inferred from the Zod schema
 */
export type FirestoreChangeEvent<T = DocumentData> = {
  type: FirestoreChangeType;
  id: string;
  data: T;
};

/**
 * Watches a Firestore collection for changes and triggers a callback function when changes occur.
 *
 * @param db - Firestore database instance
 * @param collectionPath - Path to the Firestore collection to watch
 * @param callback - Function that will be called with the change event containing type, id, and data
 * @param dataSchema - Optional Zod schema for validating document data
 * @returns An unsubscribe function that can be called to stop watching for changes
 */
export function watchCollection<T = DocumentData>(
  db: Firestore,
  collectionPath: string,
  callback: (event: FirestoreChangeEvent<T>) => void,
  dataSchema?: z.ZodType<T>
): () => void {
  try {
    const collectionRef = collection(db, collectionPath);

    // Set up the snapshot listener and return the unsubscribe function
    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        // Process each change in the snapshot
        for (const change of snapshot.docChanges()) {
          try {
            // Parse the Firestore document data
            const rawData = change.doc.data();

            // If a schema is provided, validate the data
            let docData: T;
            if (dataSchema) {
              docData = dataSchema.parse(rawData);
            } else {
              docData = rawData as T;
            }

            // Create the change event with validated type
            const changeType = firestoreChangeTypeSchema.parse(change.type);
            const event: FirestoreChangeEvent<T> = {
              type: changeType,
              id: change.doc.id,
              data: docData,
            };

            callback(event);
          } catch (err) {
            console.error(
              `Error processing Firestore document change: ${err instanceof Error ? err.message : String(err)}`
            );
            console.error('Document ID:', change.doc.id, 'Change type:', change.type);
            // Continue processing other changes even if one fails
          }
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
