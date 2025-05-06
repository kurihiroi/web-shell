import {
  type DocumentData,
  type Firestore,
  type FirestoreDataConverter,
  type PartialWithFieldValue,
  type QueryDocumentSnapshot,
  type WithFieldValue,
  collection,
  onSnapshot,
} from 'firebase/firestore';
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
 * Creates a Firestore data converter using a Zod schema for type validation
 *
 * @param schema - Zod schema for validating document data
 * @returns A FirestoreDataConverter for the given type
 */
export function createConverter<T>(schema: z.ZodType<T>): FirestoreDataConverter<T> {
  return {
    toFirestore(modelObject: WithFieldValue<T> | PartialWithFieldValue<T>): DocumentData {
      try {
        // Validate the model object against the schema
        schema.parse(modelObject);
      } catch (error) {
        console.error('Document failed schema validation:', error);
        // Always throw errors to prevent storing invalid data
        throw error;
      }

      // Return the object to be stored in Firestore
      return modelObject as DocumentData;
    },

    fromFirestore(snapshot: QueryDocumentSnapshot): T {
      const data = snapshot.data();
      try {
        // Validate and parse the data from Firestore
        return schema.parse(data);
      } catch (error) {
        console.error(`Error parsing document ${snapshot.id}:`, error);
        console.error('Raw document data:', data);

        // Always throw errors for invalid data
        throw error;
      }
    },
  };
}

/**
 * Watches a Firestore collection for changes and triggers a callback function when changes occur.
 *
 * @param db - Firestore database instance
 * @param collectionPath - Path to the Firestore collection to watch
 * @param callback - Function that will be called with the change event containing type, id, and data
 * @param converter - Firestore data converter for type validation
 * @returns An unsubscribe function that can be called to stop watching for changes
 */
export function watchCollection<T = DocumentData>(
  db: Firestore,
  collectionPath: string,
  callback: (event: FirestoreChangeEvent<T>) => void,
  converter: FirestoreDataConverter<T>
): () => void {
  try {
    // Create a collection reference with the converter
    const collectionRef = collection(db, collectionPath).withConverter(converter);

    // Set up the snapshot listener and return the unsubscribe function
    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        // Process each change in the snapshot
        for (const change of snapshot.docChanges()) {
          try {
            // Get the data - already converted by the FirestoreDataConverter
            const docData = change.doc.data();

            // Parse the change type
            const changeType = firestoreChangeTypeSchema.parse(change.type);

            // Create the change event
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
            // Throw the error to prevent processing with invalid data
            throw err;
          }
        }
      },
      (error) => {
        console.error(`Error watching Firestore collection ${collectionPath}:`, error);
        throw error; // Re-throw to ensure errors are not silently ignored
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error(`Failed to set up listener for collection ${collectionPath}:`, error);
    // Re-throw the error instead of returning a no-op function
    throw error;
  }
}

/**
 * Convenience function to watch a collection with a Zod schema instead of a converter
 *
 * @param db - Firestore database instance
 * @param collectionPath - Path to the Firestore collection to watch
 * @param callback - Function that will be called with the change event containing type, id, and data
 * @param schema - Zod schema for validating document data
 * @returns An unsubscribe function that can be called to stop watching for changes
 */
export function watchCollectionWithSchema<T>(
  db: Firestore,
  collectionPath: string,
  callback: (event: FirestoreChangeEvent<T>) => void,
  schema: z.ZodType<T>
): () => void {
  // Create a converter from the schema and use watchCollection
  const converter = createConverter(schema);
  return watchCollection(db, collectionPath, callback, converter);
}

/**
 * Example usage:
 *
 * ```typescript
 * // Define a Zod schema for your data type
 * const userSchema = z.object({
 *   name: z.string(),
 *   age: z.number(),
 *   email: z.string().email(),
 *   isActive: z.boolean().default(true),
 *   createdAt: z.date()
 * });
 *
 * // Infer TypeScript type from the schema
 * type User = z.infer<typeof userSchema>;
 *
 * // Create a converter from the schema
 * const userConverter = createConverter(userSchema);
 *
 * // Option 1: Use with converter
 * const unsubscribe1 = watchCollection<User>(
 *   db,
 *   'users',
 *   (event) => {
 *     console.log(`User ${event.id} was ${event.type}`);
 *     console.log('User data:', event.data);
 *     // event.data is fully typed as User
 *     console.log(`User ${event.data.name} is ${event.data.age} years old`);
 *   },
 *   userConverter
 * );
 *
 * // Option 2: Use with schema directly (convenience function)
 * const unsubscribe2 = watchCollectionWithSchema<User>(
 *   db,
 *   'users',
 *   (event) => {
 *     // Same as above, event.data is User type
 *     console.log(`User ${event.data.name} is ${event.data.age} years old`);
 *   },
 *   userSchema
 * );
 *
 * // Don't forget to unsubscribe when done
 * // unsubscribe1();
 * // unsubscribe2();
 * ```
 */
