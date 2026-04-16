# Changelog

All notable changes to this project will be documented in this file.

## [0.6.0] - 2026-04-16

### Added

- **PDF Export**: Users can now export their generated decks to high-quality PDF files.
- **Exponential Backoff**: Implemented resilient retry logic for OpenRouter LLM calls to handle rate limits and transient errors.
- **SSE Streaming**: Real-time progress tracking for deck generation using Server-Sent Events (SSE).
- **Modular Landing Page**: Added Hero, Features, and "How It Works" sections for a more professional entry point.
- **Pre-commit Hooks**: Integrated Ruff and other formatting tools to maintain code quality.

### Changed

- **Security**: FastAPI `/docs` and `/redoc` endpoints are now disabled in production environments.
- **Refactoring**: Improved test architecture for asynchronous deck generation.

### Fixed

- **CORS**: Removed hardcoded origins in favor of environment-based configuration.
- **Stability**: Resolved various racing conditions in concurrent LLM calls.

### Technical Debt & Internal Improvements

- Added comprehensive unit and integration tests for core services (OpenRouter, PDF exporter).
- Standardized project-wide code formatting.

---

_Generated for Release 0.6.0_
