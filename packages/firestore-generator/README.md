# @web-shell/firestore-generator

TypeScript and Zod-based Firestore document generator with event sourcing for the web-shell project.

## Features

- **Type-safe Firestore collections**: Full TypeScript support for all operations
- **Event Sourcing pattern**: Store all changes as immutable events
- **Automatic timestamps**: Track both server and client timestamps
- **Zod schema validation**: Ensure data integrity with schema validation
- **React hooks**: Ready-to-use React hooks for seamless integration
- **Strongly typed queries**: Type-safe queries with full Firebase query capabilities

## Installation

```bash
pnpm add @web-shell/firestore-generator
```

## Basic Usage

### Creating a Repository

```typescript
import { z } from 'zod';
import { createEventSourcedRepository } from '@web-shell/firestore-generator';
import { getFirestore } from 'firebase/firestore';

// Define your schema with Zod
const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().optional(),
});

// Infer TypeScript type from schema
type User = z.infer<typeof userSchema>;

// Get Firestore instance
const db = getFirestore();

// Create a repository
const userRepository = createEventSourcedRepository<User>(
  db,
  'users',
  userSchema
);
```

### Working with Entities

```typescript
// Create a new entity
async function createUser(userData: User) {
  const id = await userRepository.create(userData);
  return id;
}

// Get an entity
async function getUser(userId: string) {
  const user = await userRepository.findById(userId);
  return user;
}

// Update an entity
async function updateUser(userId: string, changes: Partial<User>) {
  await userRepository.update(userId, changes);
}

// Delete an entity
async function deleteUser(userId: string) {
  await userRepository.delete(userId);
}

// Get all entities
async function getAllUsers() {
  const users = await userRepository.findAll();
  return users;
}

// Get entity history
async function getUserHistory(userId: string) {
  const history = await userRepository.getHistory(userId);
  return history;
}
```

## React Hooks

### Using an Entity

```tsx
import { z } from 'zod';
import { useEventSourcedEntity } from '@web-shell/firestore-generator';

// Define your schema
const todoSchema = z.object({
  title: z.string(),
  completed: z.boolean(),
  priority: z.number().optional(),
});

type Todo = z.infer<typeof todoSchema>;

function TodoItem({ id }: { id: string }) {
  const { entity, loading, error } = useEventSourcedEntity<Todo>(
    'todos',
    todoSchema,
    id
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!entity) return <div>Todo not found</div>;

  return (
    <div>
      <h3>{entity.title}</h3>
      <p>Status: {entity.completed ? 'Completed' : 'Pending'}</p>
      {entity.priority && <p>Priority: {entity.priority}</p>}
    </div>
  );
}
```

### Using a Collection

```tsx
import { z } from 'zod';
import { useEventSourcedCollection } from '@web-shell/firestore-generator';
import { where } from 'firebase/firestore';

function TodoList() {
  const todoSchema = z.object({
    title: z.string(),
    completed: z.boolean(),
    priority: z.number().optional(),
  });

  type Todo = z.infer<typeof todoSchema>;

  const { entities, loading, error, refresh } = useEventSourcedCollection<Todo>(
    'todos',
    todoSchema,
    where('completed', '==', false)
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Refresh</button>
      <h2>Todo List</h2>
      <ul>
        {entities.map(todo => (
          <li key={todo.id}>
            {todo.title} {todo.priority && `(Priority: ${todo.priority})`}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Viewing Entity History

```tsx
import { z } from 'zod';
import { useEntityHistory } from '@web-shell/firestore-generator';

function TodoHistory({ id }: { id: string }) {
  const todoSchema = z.object({
    title: z.string(),
    completed: z.boolean(),
    priority: z.number().optional(),
  });

  const { history, loading, error } = useEntityHistory(
    'todos',
    todoSchema,
    id
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>Todo History</h3>
      <ul>
        {history.map(event => (
          <li key={event.id}>
            <strong>{event.type}</strong> at {event.clientTimestamp.toLocaleString()}
            <pre>{JSON.stringify(event.data, null, 2)}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Advanced Features

### Custom Event Types

```typescript
import { z } from 'zod';
import { 
  createEventCollectionFactory, 
  createEvent,
  EventDocument 
} from '@web-shell/firestore-generator';
import { getFirestore } from 'firebase/firestore';

// Define custom event types
type TodoEventType = 'create' | 'update' | 'delete' | 'complete' | 'uncomplete';

// Define a schema for the complete event data
const completeEventSchema = z.object({
  completedBy: z.string().optional(),
  completedAt: z.date()
});

// Create the event collection
const db = getFirestore();
const todoEventsCollection = createEventCollectionFactory<any, TodoEventType>(
  'todos',
  z.any()
);

// Create a custom event
async function completeTodo(
  todoId: string, 
  completedBy?: string
) {
  const eventData = {
    completedBy,
    completedAt: new Date()
  };
  
  await createEvent(
    db,
    todoEventsCollection,
    todoId,
    'complete', // Custom event type
    eventData,
    { source: 'user-action' } // Optional metadata
  );
}
```

## Benefits of Event Sourcing

1. **Complete Audit Trail**: Every change is recorded as an immutable event
2. **Time-Travel Debugging**: Reconstruct the entity state at any point in time
3. **Business Insights**: Analyze event patterns for business intelligence
4. **Resilient Architecture**: Events can be replayed to recover from errors
5. **Scalable**: Separation of write and read operations for better scaling

## Configuration

### Firestore Rules

Secure your event collections with appropriate Firestore rules:

```
service cloud.firestore {
  match /databases/{database}/documents {
    // Events should be append-only
    match /{collection}_events/{document} {
      // Allow creates, but not updates or deletes
      allow create: if request.auth != null 
                    && request.resource.data.entityId != null
                    && request.resource.data.type != null
                    && request.resource.data.clientTimestamp != null;
      allow read: if request.auth != null;
      allow update, delete: if false;
    }
  }
}