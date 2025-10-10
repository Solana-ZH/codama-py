# Release Notes

## v0.1.4-beta (2025-10-10)

### 🐛 Fixes

- Fixed genpy2 script for ES module compatibility and imports
- Updated API support to Codama 1.3.7
- Improved TypeScript configuration for better module resolution

## v0.1.3-beta (2025-08-28)

### 🔄 Renaming

- Project has been renamed from "Copyma" to "Codama-py" to better reflect its purpose as a Python client generator for Codama IDLs
- All package references, documentation, and examples have been updated to use the new name

## v0.1.2-beta (2025-08-25)

This is a beta release of Codama-py, a Solana Python client generator for Codama IDLs.

### 📦 Added

- Added `files` field to package.json to explicitly specify published files

## v0.1.1-beta (2025-08-25)

This is a beta release of Codama-py, a Solana Python client generator for Codama IDLs.

### 🚀 Features

- Generate complete Python client structure with accounts, instructions, types, and errors modules
- Automatically generate Python clients from Codama IDL files
- Support for AnchorPy-compatible code generation with extended data structures

### 🐛 Fixes

- Improved enum type layout and serialization handling
- Enhanced code generation quality and consistency

### ⚠️ Limitations

- Complex IDL structures might require manual adjustments

### 📦 Installation

```bash
pnpm install codama-py@0.1.1-beta
```

### 📚 Usage

```ts
import { renderVisitor } from 'codama-py';

const pathToGeneratedFolder = path.join(__dirname, 'clients', 'python', 'src', 'generated');
codama.accept(renderVisitor(pathToGeneratedFolder));
```

### 🙏 Feedback

The tool is under active development. Please report any issues or provide feedback.