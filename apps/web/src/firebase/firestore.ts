import {
  type DocumentData,
  type FieldValue,
  type Firestore,
  type FirestoreDataConverter,
  type PartialWithFieldValue,
  type QueryDocumentSnapshot,
  Timestamp,
  type WithFieldValue,
  collection,
  onSnapshot,
  serverTimestamp,
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
 * Zod schema for Firestore Timestamp
 * Validates that a value is a Firestore Timestamp instance
 */
export const TimestampSchema = z.custom<Timestamp>((value) => value instanceof Timestamp, {
  message: 'Value must be a Firestore Timestamp',
});

/**
 * Base Firestore document schema with required timestamp fields
 * All documents in Firestore should extend this schema
 */
export const BaseDocumentSchema = z.object({
  // Server timestamp is null when newly created and not yet committed to Firestore
  serverTimestamp: z.union([TimestampSchema, z.null()]),
  // Client timestamp is always required and set by the client
  clientTimestamp: TimestampSchema,
});

/**
 * Type inferred from the base document schema
 */
export type BaseDocument = z.infer<typeof BaseDocumentSchema>;

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
 * @param schema - Zod schema for validating document data
 * @returns An unsubscribe function that can be called to stop watching for changes
 */
export function watchCollection<T>(
  db: Firestore,
  collectionPath: string,
  callback: (event: FirestoreChangeEvent<T>) => void,
  schema: z.ZodType<T>
): () => void {
  try {
    // Create a converter from the schema
    const converter = createConverter(schema);

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
 * Creates a new document with timestamps already set
 *
 * @param data - The document data without timestamps
 * @returns Document data with timestamps added
 */
export function createDocumentWithTimestamps<T extends object>(data: T): T & BaseDocument {
  return {
    ...data,
    serverTimestamp: null, // Will be set by server when committed
    clientTimestamp: Timestamp.now(),
  };
}

/**
 * Prepares a document update with server timestamp
 * Use this when updating a document to ensure server timestamp is properly set
 *
 * @param data - The document data to update
 * @returns Document data with server timestamp field set to server timestamp value
 */
export function updateWithServerTimestamp<T extends object>(
  data: T
): T & { serverTimestamp: FieldValue } {
  return {
    ...data,
    serverTimestamp: serverTimestamp(), // Will be resolved on the server
  };
}

/**
 * Creates a Zod schema that extends the base document schema with additional fields
 *
 * @param schema - The schema for additional document fields
 * @returns A combined schema that includes timestamp fields
 */
export function createDocumentSchema<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return BaseDocumentSchema.extend(schema.shape);
}

/**
 * Example usage:
 *
 * ```typescript
 * // Define a Zod schema for your data type (without timestamps)
 * const userDataSchema = z.object({
 *   name: z.string(),
 *   age: z.number(),
 *   email: z.string().email(),
 *   isActive: z.boolean().default(true),
 * });
 *
 * // Create a complete document schema with timestamps
 * const userSchema = createDocumentSchema(userDataSchema);
 *
 * // Infer TypeScript type from the schema
 * type User = z.infer<typeof userSchema>;
 *
 * // Use watchCollection with the schema
 * const unsubscribe = watchCollection<User>(
 *   db,
 *   'users',
 *   (event) => {
 *     console.log(`User ${event.id} was ${event.type}`);
 *     console.log('User data:', event.data);
 *     // event.data is fully typed as User with timestamp fields
 *     console.log(`User ${event.data.name} was created at ${event.data.clientTimestamp.toDate()}`);
 *
 *     // Check if server has processed the document
 *     if (event.data.serverTimestamp) {
 *       console.log(`Server processed at: ${event.data.serverTimestamp.toDate()}`);
 *     }
 *   },
 *   userSchema
 * );
 *
 * // CREATING DOCUMENTS
 * // When creating new documents, add timestamps
 * const newUser = createDocumentWithTimestamps({
 *   name: 'John Doe',
 *   age: 25,
 *   email: 'john@example.com',
 *   isActive: true,
 * });
 *
 * // Add to Firestore with type safety
 * // Example: await addDoc(collection(db, 'users'), newUser);
 *
 * // UPDATING DOCUMENTS
 * // When updating a document, use updateWithServerTimestamp to update the server timestamp
 * const userUpdates = updateWithServerTimestamp({
 *   name: 'John Smith', // Updated name
 *   age: 26, // Updated age
 * });
 *
 * // Update the document with these changes
 * // Example: await updateDoc(docRef, userUpdates);
 *
 * // USING CONVERTERS
 * // Create a converter for type-safe operations
 * const userConverter = createConverter(userSchema);
 *
 * // Use the converter with Firestore references
 * // Example: const typedUserRef = doc(db, 'users', userId).withConverter(userConverter);
 *
 * // Don't forget to unsubscribe when done watching collections
 * // unsubscribe();
 * ```
 */
