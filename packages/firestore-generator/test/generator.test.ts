import type { Firestore, QueryConstraint } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { firestoreGenerator } from '../src/generator';

// Define a mock Firestore type for testing
interface MockFirestore extends Partial<Firestore> {
  // Add any methods or properties needed for testing
}

// Mock Firebase Firestore
vi.mock('firebase/firestore', async () => {
  return {
    collection: vi.fn(() => ({
      withConverter: vi.fn(() => 'mock-collection-ref'),
    })),
    doc: vi.fn(() => 'mock-doc-ref'),
    query: vi.fn((...args) => ['mock-query', ...args.slice(1)]),
    Timestamp: {
      fromDate: vi.fn((date) => ({ toDate: () => date })),
    },
    serverTimestamp: vi.fn(() => ({ type: 'serverTimestamp' })),
  };
});

// Mock the utils to avoid using the actual serverTimestamp
vi.mock('../src/utils', async () => {
  return {
    createConverter: vi.fn(() => ({
      toFirestore: vi.fn((data) => ({ ...data })),
      fromFirestore: vi.fn((snapshot) => ({
        ...snapshot.data(),
        id: snapshot.id,
      })),
    })),
    createEventConverter: vi.fn(() => ({
      toFirestore: vi.fn((data) => ({ ...data })),
      fromFirestore: vi.fn((snapshot) => ({
        ...snapshot.data(),
        id: snapshot.id,
      })),
    })),
    serverTimestamp: vi.fn(() => ({ type: 'serverTimestamp' })),
  };
});

describe('firestoreGenerator', () => {
  const userSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    age: z.number().optional(),
  });

  type User = z.infer<typeof userSchema>;

  let userCollection: ReturnType<typeof firestoreGenerator.createCollection<User>>;
  const mockDb: MockFirestore = {};

  beforeEach(() => {
    userCollection = firestoreGenerator.createCollection<User>('users', userSchema);
    vi.clearAllMocks();
  });

  it('should create a collection with the correct name', () => {
    expect(userCollection.collectionName).toBe('users');
  });

  it('should store the schema', () => {
    expect(userCollection.schema).toBe(userSchema);
  });

  it('should create a collection reference', () => {
    const collectionRef = userCollection.ref(mockDb as Firestore);
    expect(collectionRef).toBe('mock-collection-ref');
  });

  it('should create a document reference', () => {
    const docRef = userCollection.doc(mockDb as Firestore, '123');
    expect(docRef).toBe('mock-doc-ref');
  });

  it('should create a query with constraints', () => {
    const constraint1 = { type: 'where' } as unknown as QueryConstraint;
    const constraint2 = { type: 'orderBy' } as unknown as QueryConstraint;

    const queryRef = userCollection.query(mockDb as Firestore, constraint1, constraint2);

    expect(queryRef).toEqual(['mock-query', constraint1, constraint2]);
  });
});
