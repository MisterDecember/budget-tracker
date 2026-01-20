# Architecture & Design Decisions

This document explains the architectural choices and design patterns used in PixelVault.

## Overview

PixelVault follows a modern React architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Pages  │ │Components│ │   UI    │ │ Hooks   │           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       │           │           │           │                  │
│       └───────────┴───────────┴───────────┘                  │
│                         │                                    │
├─────────────────────────┼────────────────────────────────────┤
│                   State Layer                                │
│            ┌────────────┴────────────┐                       │
│            │    Zustand Stores       │                       │
│            │  ┌──────┐ ┌──────────┐  │                       │
│            │  │ Auth │ │ Finance  │  │                       │
│            │  └──────┘ └──────────┘  │                       │
│            └────────────┬────────────┘                       │
│                         │                                    │
├─────────────────────────┼────────────────────────────────────┤
│                   Data Layer                                 │
│            ┌────────────┴────────────┐                       │
│            │      IndexedDB          │                       │
│            │  ┌─────────────────┐    │                       │
│            │  │  idb wrapper    │    │                       │
│            │  └─────────────────┘    │                       │
│            └─────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

## Key Decisions

### 1. Vite over Create React App

**Decision**: Use Vite as the build tool

**Rationale**:
- Significantly faster development server startup
- Hot Module Replacement (HMR) is nearly instant
- Modern ESM-based architecture
- Better TypeScript support out of the box
- Smaller production bundles

### 2. Zustand over Redux/Context

**Decision**: Use Zustand for state management

**Rationale**:
- Minimal boilerplate compared to Redux
- No need for providers/wrappers
- Built-in persistence middleware
- TypeScript-first design
- Small bundle size (~1KB)
- Simple mental model

**Trade-offs**:
- Less ecosystem/middleware than Redux
- No Redux DevTools (though Zustand has its own)

### 3. IndexedDB over LocalStorage

**Decision**: Use IndexedDB (via `idb` library) for data persistence

**Rationale**:
- Structured data storage (not just strings)
- Much larger storage limits (~50MB+ vs 5MB)
- Indexed queries for better performance
- Support for complex data types
- Async API doesn't block main thread

**Trade-offs**:
- More complex API (mitigated by `idb` wrapper)
- Requires async handling everywhere

### 4. shadcn/ui over Material UI/Chakra

**Decision**: Use shadcn/ui component library

**Rationale**:
- Copy-paste components (not a dependency)
- Full control over component code
- Built on Radix UI (accessible by default)
- Tailwind CSS native
- Highly customizable
- No runtime CSS-in-JS overhead

**Trade-offs**:
- More initial setup
- Components need manual updates

### 5. Tailwind CSS over CSS Modules/Styled Components

**Decision**: Use Tailwind CSS for styling

**Rationale**:
- Rapid prototyping with utility classes
- Consistent design system via config
- No CSS file management
- Dead code elimination in production
- Great developer experience

**Trade-offs**:
- HTML can look cluttered
- Learning curve for utility classes
- Requires PostCSS setup

### 6. Client-Side Only (No Backend)

**Decision**: Store all data locally, no server required

**Rationale**:
- Zero deployment complexity
- Works offline
- Complete data privacy
- No hosting costs
- Faster development iteration

**Trade-offs**:
- No cross-device sync (planned: Google Drive)
- Data loss if browser storage cleared
- No collaborative features

## Component Architecture

### Page Components
Pages are top-level route components that:
- Load data on mount via Zustand stores
- Compose UI from smaller components
- Handle modals and dialogs
- Manage local UI state (forms, filters)

```typescript
// Pattern used in all pages
function SomePage() {
  const { user } = useAuthStore()
  const { data, loadData, addItem } = useFinanceStore()
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (user?.id) loadData(user.id)
  }, [user?.id])

  return (
    <div>
      <Header onAdd={() => setDialogOpen(true)} />
      <DataList data={data} />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <Form onSubmit={addItem} />
      </Dialog>
    </div>
  )
}
```

### UI Components
Atomic, reusable components from shadcn/ui:
- No business logic
- Accept props for customization
- Use `cn()` for class merging
- Forward refs when needed

### Feature Components
Domain-specific components like `StatCard`:
- Combine UI components
- Light business logic (formatting)
- Reusable across pages

## State Management Pattern

### Store Structure

```typescript
interface StoreState {
  // Data
  items: Item[]
  isLoading: boolean
  
  // Actions
  loadItems: (userId: number) => Promise<void>
  addItem: (item: Omit<Item, 'id'>) => Promise<void>
  updateItem: (item: Item) => Promise<void>
  deleteItem: (id: number) => Promise<void>
  
  // Computed (as functions)
  getTotal: () => number
}
```

### Why Computed as Functions?

Zustand doesn't have built-in computed properties. Using functions:
- Avoids stale closure issues
- Computes fresh on each call
- Works naturally with TypeScript

```typescript
// In store
getTotal: () => {
  return get().items.reduce((sum, i) => sum + i.amount, 0)
}

// In component
const total = useFinanceStore().getTotal()
```

## Data Flow

```
User Action
    │
    ▼
Component calls store action
    │
    ▼
Store action updates IndexedDB
    │
    ▼
Store action updates Zustand state
    │
    ▼
React re-renders subscribed components
    │
    ▼
UI updates
```

## Security Considerations

### Password Handling
- Passwords are hashed with SHA-256 before storage
- Never stored or transmitted in plain text
- For production, consider bcrypt or Argon2

### Data Storage
- All data stored locally in IndexedDB
- No data sent to external servers
- User responsible for backups

### Authentication
- Session persisted via Zustand persist middleware
- Stored in localStorage
- No token expiration (local-only app)

## Future Considerations

### Cloud Sync (Planned)
Architecture supports adding cloud sync:
1. Add sync layer between stores and IndexedDB
2. Implement conflict resolution
3. Use Google Drive API for storage

### Multi-Currency (Planned)
- Add `currency` field to accounts
- Store exchange rates
- Convert for display, store in original currency

### Performance Optimization (If Needed)
- Virtual scrolling for large lists
- Memoization with `useMemo`/`useCallback`
- Code splitting per route (already via React Router)