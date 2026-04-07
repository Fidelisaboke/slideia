# Slideia

## Project Overview

Slideia is an open-source application and service for generating presentation slide decks using large language models (LLMs). Built as a modern monorepo, it features a Next.js frontend and a FastAPI backend. It can propose outlines, draft slide content, and export to PowerPoint via API, UI, CLI, or MCP protocol.

## Repository Structure

This project is structured as a monorepo using **Turborepo**, **pnpm workspaces**, and **uv workspaces** to natively support multi-language local caching and fast builds.

- `apps/frontend/`: Next.js web application for the UI.
- `apps/backend/`: FastAPI Python application handling presentation generation, LLM integrations, and PowerPoint exports.
- `packages/`: Shared configurations and common tooling.

## Tech Stack

### Frontend
- Next.js (React)
- Tailwind CSS / ui.shadcn
- pnpm

### Backend
- Python 3.11+
- FastAPI (HTTP API)
- python-pptx (PowerPoint export)
- MCP (Model Context Protocol) server
- pytest & ruff (testing and linting)
- uv (Python package manager)

### Infrastructure
- Turborepo
- Docker / Docker Compose
- GitHub Actions

## Installation and Setup

### Pre-requisites

- Node.js 20+ and `pnpm`
- Python 3.11+ and `uv`
- API key for OpenRouter

### Setup Instructions

1. Clone the repository:
	 ```bash
	 git clone https://github.com/Fidelisaboke/slideia.git
	 cd slideia
	 ```
2. Install all dependencies (Node and Python) from the root workspace:
	 ```bash
	 pnpm install
	 uv sync --all-packages
	 ```
3. Set up LLM API keys for the backend:
	 - For OpenRouter: `export OPENROUTER_API_KEY=your_api_key`
	 - Alternatively, create an `.env` file in `apps/backend/` and set `OPENROUTER_API_KEY=your_api_key`

## Basic Usage

- **Run the full local development stack (Frontend & Backend):**
	```bash
	pnpm turbo run dev
	```
- **Run the validation pipeline (Linting & Testing):**
	```bash
	pnpm turbo run lint test
	```
- **Run the MCP server independently:**
	```bash
	cd apps/backend
	uv run python -m slideia.server
	```
- **Generate a full slide deck via API:**
	```bash
	curl -X POST http://localhost:8000/generate_deck \
		-H 'Content-Type: application/json' \
		-d '{"topic": "AI in Education", "audience": "Teachers", "tone": "formal", "slides": 5}'
	```

## Acknowledgement

- Built with inspiration from the open-source LLM and presentation tooling community.
- Uses OpenRouter for free LLM access.

## License

This project is licensed under the terms of the MIT License. See the [LICENSE](LICENSE) file for details.
