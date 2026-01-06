# Bar Chart Tool - Agent Guide

This file contains guidelines and commands for agentic coding agents working on this SolidJS/Astro bar chart tool repository.

## Development Commands

### Core Development

```bash
# Build for production
bun run build

# Preview production build
bun run preview

# Run all tests
bun test

# Run single test file
bun test tests/csv.test.ts

# Watch mode for tests
bun test --watch
```

Never start develpoment server yourself

### Code Quality

```bash
# Format code using oxfmt
bun run format

# Lint code using oxlint
bun run lint
```

## Project Architecture

### Tech Stack

- **Framework**: Astro (static site generation)
- **UI Library**: SolidJS with TypeScript
- **Styling**: Tailwind CSS
- **Package Manager**: Bun
- **Testing**: Bun's built-in test runner
- **Linting/Formatting**: oxlint + oxfmt

### Directory Structure

```text
src/
├── pages/index.astro          # Main HTML page with head/body structure
├── components/
│   └── App.tsx                 # Main SolidJS application component
├── lib/
│   └── csv.ts                 # CSV parsing utilities
└── tests/
    └── csv.test.ts            # Tests for CSV functionality
```

### Key Patterns

- **index.astro**: Contains only HTML structure (`<head>` and `<body>`) with `<App client:load />`
- **App.tsx**: Contains all UI logic, state management, and chart rendering
- **Separation of Concerns**: Parsing logic in `lib/`, UI components in `components/`

## Code Style Guidelines

### Imports

```typescript
// SolidJS imports first
import { createSignal, createEffect } from "solid-js";

// Then relative imports
import { parseCSV } from "../lib/csv";
```

### Component Structure (SolidJS)

```typescript
// 1. Imports
import { createSignal, createEffect } from 'solid-js';

// 2. Interface definitions (if needed)
interface ChartData {
  headers: string[];
  data: Record<string, string | number>[];
}

// 3. Component function
export default function ComponentName() {
  // 4. Signals and state
  const [data, setData] = createSignal<DataType | null>(null);

  // 5. Event handlers
  const handleClick = () => { /* ... */ };

  // 6. Effects
  createEffect(() => {
    // React to signal changes
  });

  // 7. Return JSX
  return (
    <div>
      {/* JSX content */}
    </div>
  );
}
```

### Type Safety

- Always use TypeScript interfaces for complex data structures
- Use non-null assertion (`!`) only when you're certain a value exists
- Prefer optional chaining (`?.`) over type assertions
- Use proper typing for SolidJS signals: `createSignal<Type>()`

### Error Handling

```typescript
// Handle file operations safely
const handleFile = (file: File) => {
  if (file.type !== "text/csv") return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const csvText = e.target?.result as string;
    try {
      const data = parseCSV(csvText);
      setData(data);
    } catch (error) {
      console.error("Failed to parse CSV:", error);
    }
  };
  reader.readAsText(file);
};
```

### Naming Conventions

- **Components**: PascalCase (`BarChart`, `CsvUpload`)
- **Functions**: camelCase (`parseCSV`, `handleFile`)
- **Variables**: camelCase (`chartData`, `isDragOver`)
- **Signals**: Descriptive names with type suffixes when helpful (`chartData`, `isLoading`)
- **Files**:
  - Components: `ComponentName.tsx` (PascalCase)
  - Utilities: `utilityName.ts` (camelCase)
  - Tests: `utilityName.test.ts`

### CSS and Styling

- Use `<style>{`css here`}</style>` in SolidJS components for scoped styles
- Keep styles minimal and utility-focused
- Use CSS variables for colors when possible
- Ensure responsive design with mobile-first approach

### Canvas API Usage

- Always check for context existence: `if (!ctx) return;`
- Use proper typing: `const canvas = document.getElementById('barChart') as HTMLCanvasElement;`
- Clear canvas before drawing: `ctx.clearRect(0, 0, canvas.width, canvas.height);`
- Restore context state when using transformations: `ctx.save()` and `ctx.restore()`

## Testing Guidelines

### Test Structure (Bun)

```typescript
import { describe, it, expect } from "bun:test";
import { functionToTest } from "../src/lib/file";

describe("Feature Name", () => {
  it("should handle basic case", () => {
    // Arrange
    const input = "test input";

    // Act
    const result = functionToTest(input);

    // Assert
    expect(result).toEqual(expectedOutput);
  });
});
```

### Test Coverage

- Test utility functions thoroughly (especially CSV parsing)
- Test edge cases: empty input, malformed data, type variations
- Focus on data transformation logic over UI components
- Use descriptive test names that explain the behavior

## Development Workflow

### Before Committing

1. Run `bun run quality` to do all quality checks like formatting, linting and tests

### When Adding Features

1. Follow the existing component structure
2. Add appropriate TypeScript types
3. Include tests for new utility functions
4. Ensure responsive design is maintained
5. Update this AGENTS.md file if patterns change

## Common Gotchas

### SolidJS Specific

- Use `client:load` directive when hydrating SolidJS components in Astro
- Signals are functions: access with `signal()`, set with `setSignal(newValue)`
- Use `createEffect` for side effects, not `useEffect` (React)
- Event handlers are defined as regular functions, not with `on` prefix

### TypeScript Configuration

- JSX configured for SolidJS: `"jsxImportSource": "solid-js"`
- Using strictest Astro TypeScript config
- Preserve JSX for SolidJS: `"jsx": "preserve"`

### CSV Parsing

- Handle empty CSV files gracefully
- First CSV column becomes labels, second becomes values
- Numbers should be parsed, strings remain as strings
- Handle missing or inconsistent data without crashes

## Project Specific Notes

This is a simple bar chart visualization tool that:

1. Accepts CSV files via drag-and-drop
2. Automatically generates bar charts with proper axes labels
3. Uses first column as X-axis labels, second column as Y-axis values
4. Maintains a clean, minimalist UI design

The focus is on simplicity and ease of use - users should be able to drop a CSV file and immediately see a meaningful visualization.
