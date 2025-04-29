import {
  DocumentReference,
  type Firestore,
  QueryConstraint,
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  where,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import {
  createEntity,
  createEvent,
  deleteEntity,
  getEntityEvents,
  getLatestEntityState,
  updateEntity,
} from './events';
import { createEventCollectionFactory } from './generator';
import { EventCollection, type EventDocument, EventType, type FirestoreDocument } from './types';

export interface EventSourcedRepository<T> {
  create(data: T): Promise<string>;
  findById(id: string): Promise<FirestoreDocument<T> | null>;
  findAll(): Promise<FirestoreDocument<T>[]>;
  update(id: string, changes: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
  getHistory(id: string): Promise<EventDocument<unknown>[]>;
}

export function createEventSourcedRepository<T>(
  db: Firestore,
  collectionName: string,
  schema: z.ZodType<T>
): EventSourcedRepository<T> {
  // Create event collections for each operation type
  const createEventsCollection = createEventCollectionFactory<T, 'create'>(collectionName, schema);

  const updateEventsCollection = createEventCollectionFactory<
    T & { changes: Partial<T> },
    'update'
  >(collectionName, schema.extend({ changes: schema.partial() }));

  const deleteEventsCollection = createEventCollectionFactory<{ id: string }, 'delete'>(
    collectionName,
    z.object({ id: z.string() })
  );

  // Generic events collection for querying all events
  const allEventsCollection = createEventCollectionFactory(collectionName, schema);

  return {
    async create(data: T): Promise<string> {
      try {
        // Validate data against schema
        schema.parse(data);

        // Generate a new entity ID
        const entityId = uuidv4();

        // Create the entity
        await createEntity(db, createEventsCollection, data, entityId);

        return entityId;
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`Validation error: ${JSON.stringify(error.errors)}`);
        }
        throw error;
      }
    },

    async findById(id: string): Promise<FirestoreDocument<T> | null> {
      return getLatestEntityState(db, allEventsCollection, id);
    },

    async findAll(): Promise<FirestoreDocument<T>[]> {
      // Get all create events to get all entity IDs
      const createEventsQuery = query(createEventsCollection.ref(db));

      const createEvents = await getDocs(createEventsQuery);
      const entityIds = createEvents.docs.map((doc) => doc.data().entityId);

      // Get the latest state for each entity
      const results: FirestoreDocument<T>[] = [];

      for (const id of entityIds) {
        const entity = await this.findById(id);
        if (entity) {
          results.push(entity);
        }
      }

      return results;
    },

    async update(id: string, changes: Partial<T>): Promise<void> {
      // Get the current state
      const currentState = await this.findById(id);

      if (!currentState) {
        throw new Error(`Entity with ID ${id} not found`);
      }

      // Create update event
      await updateEntity(db, updateEventsCollection, id, changes, currentState);
    },

    async delete(id: string): Promise<void> {
      // Check if entity exists
      const currentState = await this.findById(id);

      if (!currentState) {
        throw new Error(`Entity with ID ${id} not found`);
      }

      // Create delete event
      await deleteEntity(db, deleteEventsCollection, id);
    },

    async getHistory(id: string): Promise<EventDocument<unknown>[]> {
      return getEntityEvents(db, allEventsCollection, id);
    },
  };
}
