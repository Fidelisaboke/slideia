
# slideia

AI-powered slide generator that creates slide templates from scratch.

## Project Overview

slideia is an open-source Python package and service for generating presentation slide decks using large language models (LLMs). It can propose outlines, draft slide content, and export to PowerPoint, all via API, CLI, or MCP protocol.

## Tech Stack

- Python 3.8+
- FastAPI (HTTP API)
- python-pptx (PowerPoint export)
- MCP (Model Context Protocol) server
- pytest (testing)
- flake8 (linting)
- OpenRouter/Google AI Studio (LLM integration)

## Installation and Setup

### Pre-requisites

- Python 3.8 or higher
- pip (Python package manager)
- (Optional) API keys for OpenRouter or Google AI Studio for LLM features

### Setup Instructions

1. Clone the repository:
	 ```bash
	 git clone https://github.com/Fidelisaboke/slideia.git
	 cd slideia
	 ```
2. Create and activate a virtual environment:
	 ```bash
	 python -m venv .venv
	 source .venv/bin/activate
	 ```
3. Install dependencies:
	 ```bash
	 pip install -e .[test]
	 pip install fastapi pydantic python-pptx requests
	 ```
4. (Optional) Set up LLM API keys:
	 - For OpenRouter: `export OPENROUTER_API_KEY=...`
	 - For Google AI Studio: `export GOOGLE_AI_API_KEY=...`

## Basic Usage

- **Run the MCP server:**
	```bash
	python -m slideia.server
	```
- **Run the FastAPI HTTP server:**
	```bash
	uvicorn slideia:app --factory --reload
	```
- **Generate a slide outline via API:**
	```bash
	curl -X POST http://localhost:8000/generate_outline \
		-H 'Content-Type: application/json' \
		-d '{"topic": "AI in Education", "audience": "Teachers", "tone": "formal", "slides": 5}'
	```
- **Generate a full deck via API:**
	```bash
	curl -X POST http://localhost:8000/generate_deck \
		-H 'Content-Type: application/json' \
		-d '{"topic": "AI in Education", "audience": "Teachers", "tone": "formal", "slides": 5}'
	```

## Acknowledgement

- Built with inspiration from the open-source LLM and presentation tooling community.
- Uses OpenRouter and Google AI Studio for free LLM access.

## License

This project is licensed under the terms of the MIT License. See the [LICENSE](LICENSE) file for details.
