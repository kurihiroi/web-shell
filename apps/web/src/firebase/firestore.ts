import {
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
  type FieldValue,
  type Firestore,
  type FirestoreDataConverter,
  type PartialWithFieldValue,
  type Query,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  Timestamp,
  type WithFieldValue,
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
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
 * Base schema for discriminated union document types
 * Adds a required 'type' field to identify the document type
 */
export const DiscriminatedDocumentSchema = BaseDocumentSchema.extend({
  // Type field for discriminating between different document types
  type: z.string(),
});

/**
 * Type inferred from the discriminated document schema
 */
export type DiscriminatedDocument = z.infer<typeof DiscriminatedDocumentSchema>;

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
 * @param collectionRef - Reference to the Firestore collection to watch
 * @param callback - Function that will be called with the change event containing type, id, and data
 * @param schema - Zod schema for validating document data
 * @returns An unsubscribe function that can be called to stop watching for changes
 */
export function watchCollection<T>(
  collectionRef: CollectionReference<DocumentData>,
  callback: (event: FirestoreChangeEvent<T>) => void,
  schema: z.ZodType<T>
): () => void {
  try {
    // Create a converter from the schema
    const converter = createConverter(schema);

    // Apply the converter to the collection reference
    const typedCollectionRef = collectionRef.withConverter(converter);

    // Set up the snapshot listener and return the unsubscribe function
    const unsubscribe = onSnapshot(
      typedCollectionRef,
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
        console.error(`Error watching Firestore collection ${collectionRef.path}:`, error);
        throw error; // Re-throw to ensure errors are not silently ignored
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error(`Failed to set up listener for collection ${collectionRef.path}:`, error);
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
 * Creates a discriminated document schema with a specific type value
 *
 * @param type - The string literal type identifier
 * @param schema - The schema for document-specific fields
 * @returns A schema for the discriminated document type
 */
export function createDiscriminatedDocumentSchema<T extends string, S extends z.ZodRawShape>(
  type: T,
  schema: z.ZodObject<S>
): ZodDiscriminatedObjectSchema<T> {
  return DiscriminatedDocumentSchema.extend({
    type: z.literal(type),
    ...schema.shape,
  }) as ZodDiscriminatedObjectSchema<T>;
}

/**
 * Type for a Zod object schema that has a 'type' discriminator field with a literal string value
 */
export type ZodDiscriminatedObjectSchema<T extends string = string> = z.ZodObject<
  z.ZodRawShape & { type: z.ZodLiteral<T> }
>;

/**
 * Creates a discriminated union from multiple document schemas
 * Each schema must have a 'type' field with a literal string value
 *
 * @param schemas - Array of document schemas with type discriminators
 * @returns A Zod union representing the discriminated document types
 */
export function createDiscriminatedUnion<
  T extends string,
  U extends [ZodDiscriminatedObjectSchema<T>, ...ZodDiscriminatedObjectSchema<T>[]],
>(
  // The input is an array of Zod object schemas with 'type' discriminator
  schemas: readonly [...U]
): z.ZodDiscriminatedUnion<'type', readonly [...U]> {
  // The type parameter 'type' is the discriminator field name
  // U is a tuple type of at least one schema, ensuring we have at least one schema
  return z.discriminatedUnion('type', schemas);
}

/**
 * Creates a document with timestamps and a specific type discriminator
 *
 * @param type - The type discriminator string
 * @param data - The document data without timestamps and type
 * @returns Document data with timestamps and type field added
 */
export function createDiscriminatedDocument<T extends string, D extends object>(
  type: T,
  data: D
): D & Omit<DiscriminatedDocument, 'type'> & { type: T } {
  return {
    ...data,
    type,
    serverTimestamp: null, // Will be set by server when committed
    clientTimestamp: Timestamp.now(),
  };
}

/**
 * Creates a typed collection reference using a Zod schema for validation
 *
 * @param db - Firestore database instance
 * @param collectionPath - Path to the Firestore collection
 * @param schema - Zod schema for validating document data
 * @returns A typed CollectionReference for the given path and schema
 */
export function createCollectionRef<T>(
  db: Firestore,
  collectionPath: string,
  schema: z.ZodType<T>
): CollectionReference<T> {
  const converter = createConverter(schema);
  return collection(db, collectionPath).withConverter(converter);
}

/**
 * Creates a typed document reference within a collection
 *
 * @param collectionRef - Reference to the Firestore collection
 * @param docId - ID of the document
 * @returns A typed DocumentReference for the given collection and document ID
 */
export function createDocumentRef<T>(
  collectionRef: CollectionReference<T>,
  docId: string
): DocumentReference<T> {
  return doc(collectionRef, docId);
}

/**
 * Creates a typed query from a collection reference with optional query constraints
 *
 * @param collectionRef - Reference to the Firestore collection
 * @param constraints - Optional query constraints (where, orderBy, limit, etc.)
 * @returns A typed Query for the given collection with applied constraints
 */
export function createQuery<T>(
  collectionRef: CollectionReference<T>,
  ...constraints: QueryConstraint[]
): Query<T> {
  return query(collectionRef, ...constraints);
}

/**
 * Adds a document to a Firestore collection with an auto-generated ID
 *
 * @param collectionRef - Reference to the Firestore collection
 * @param data - Document data to add
 * @returns A promise that resolves to the DocumentReference of the newly created document
 */
export async function addDocument<T extends object>(
  collectionRef: CollectionReference<T>,
  data: T
): Promise<DocumentReference<T>> {
  // Add timestamps to the data if it doesn't already have them
  // This ensures all documents have consistent timestamp fields
  const dataWithTimestamps = 'clientTimestamp' in data ? data : createDocumentWithTimestamps(data);

  // Write the document to Firestore with an auto-generated ID
  return await addDoc(collectionRef, dataWithTimestamps);
}

/**
 * Example usage:
 *
 * ```typescript
 * // BASIC DOCUMENT EXAMPLE WITH TIMESTAMPS
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
 * // Create a user document with timestamps
 * const newUser = createDocumentWithTimestamps({
 *   name: 'John Doe',
 *   age: 25,
 *   email: 'john@example.com',
 *   isActive: true,
 * });
 *
 * // Create a typed collection reference
 * const usersCollectionRef = createCollectionRef(db, 'users', userSchema);
 *
 * // DISCRIMINATED UNION EXAMPLE
 * // Define different document schemas for each type
 * const customerSchema = createDiscriminatedDocumentSchema('customer', z.object({
 *   name: z.string(),
 *   email: z.string().email(),
 *   subscription: z.enum(['free', 'basic', 'premium']),
 * }));
 *
 * const productSchema = createDiscriminatedDocumentSchema('product', z.object({
 *   name: z.string(),
 *   price: z.number(),
 *   inventory: z.number(),
 *   category: z.string(),
 * }));
 *
 * const orderSchema = createDiscriminatedDocumentSchema('order', z.object({
 *   customerId: z.string(),
 *   items: z.array(z.object({
 *     productId: z.string(),
 *     quantity: z.number(),
 *     price: z.number(),
 *   })),
 *   total: z.number(),
 *   status: z.enum(['pending', 'processing', 'shipped', 'delivered']),
 * }));
 *
 * // Create a discriminated union of all document types
 * const storeDocumentSchema = createDiscriminatedUnion([
 *   customerSchema,
 *   productSchema,
 *   orderSchema,
 * ]);
 *
 * // Infer the union type
 * type StoreDocument = z.infer<typeof storeDocumentSchema>;
 *
 * // Create a typed collection reference for the store
 * const storeCollectionRef = createCollectionRef(db, 'store', storeDocumentSchema);
 *
 * // Now we can create documents of specific types
 * const newCustomer = createDiscriminatedDocument('customer', {
 *   name: 'Jane Smith',
 *   email: 'jane@example.com',
 *   subscription: 'premium',
 * });
 *
 * // Type checking works - this would cause a type error if 'inventory' is misspelled or wrong type
 * const newProduct = createDiscriminatedDocument('product', {
 *   name: 'Awesome Widget',
 *   price: 49.99,
 *   inventory: 100,
 *   category: 'widgets',
 * });
 *
 * // Watch a collection with discriminated types
 * const unsubscribe = watchCollection<StoreDocument>(
 *   storeCollectionRef,
 *   (event) => {
 *     // The event.data is fully typed based on the discriminated union
 *     console.log(`Document ${event.id} was ${event.type}`);
 *
 *     // We can use type narrowing based on the discriminator
 *     switch (event.data.type) {
 *       case 'customer':
 *         // event.data is narrowed to Customer type
 *         console.log(`Customer: ${event.data.name}, Subscription: ${event.data.subscription}`);
 *         break;
 *
 *       case 'product':
 *         // event.data is narrowed to Product type
 *         console.log(`Product: ${event.data.name}, Price: ${event.data.price}`);
 *         break;
 *
 *       case 'order':
 *         // event.data is narrowed to Order type
 *         console.log(`Order for customer: ${event.data.customerId}, Status: ${event.data.status}`);
 *         break;
 *     }
 *
 *     // Timestamps are available on all document types
 *     console.log(`Created at: ${event.data.clientTimestamp.toDate()}`);
 *   },
 *   storeDocumentSchema
 * );
 *
 * // Create a query with constraints
 * // Import where and orderBy from 'firebase/firestore' first
 * // import { where, orderBy } from 'firebase/firestore';
 * const activeProductsQuery = createQuery(
 *   storeCollectionRef,
 *   where('type', '==', 'product'),
 *   where('inventory', '>', 0),
 *   orderBy('price', 'asc')
 * );
 *
 * // Add a new product with auto-generated ID
 * const newProductRef = await addDocument(storeCollectionRef, newProduct);
 * console.log(`New product added with ID: ${newProductRef.id}`);
 *
 * // Don't forget to unsubscribe when done
 * // unsubscribe();
 * ```
 */
