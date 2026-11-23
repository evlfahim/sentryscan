// Setup file: mock vscode before extension.ts is imported
import { vi } from 'vitest';

// Create a full vscode mock
const vscodeMock = {
  commands: {
    registerCommand: vi.fn().mockReturnValue({ dispose: vi.fn() })
  },
  window: {
    activeTextEditor: null,
    showInformationMessage: vi.fn().mockResolvedValue(undefined)
  },
  languages: {
    createDiagnosticCollection: vi.fn().mockReturnValue({
      set: vi.fn(),
      dispose: vi.fn()
    })
  },
  Position: class {
    line: number;
    character: number;
    constructor(line: number, character: number) {
      this.line = line;
      this.character = character;
    }
  },
  Range: class {
    start: any;
    end: any;
    constructor(start: any, end: any) {
      this.start = start;
      this.end = end;
    }
  },
  DiagnosticSeverity: {
    Error: 0,
    Warning: 1,
    Information: 2
  },
  Diagnostic: class {
    range: any;
    message: string;
    severity: number;
    constructor(range: any, message: string, severity: number) {
      this.range = range;
      this.message = message;
      this.severity = severity;
    }
  }
};

vi.mock('vscode', () => vscodeMock);
