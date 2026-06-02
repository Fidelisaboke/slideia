# Slideia Backend Core

This is the backend service for **Slideia**, an AI-powered presentation creator. Built with FastAPI and Python, it handles slide outline generation, slide drafting, PDF content extraction, PowerPoint exporting, and interactive AI agent sessions.

## Project Architecture & AI Agent

The presentation generation flow is structured as a stateful, multi-turn AI Agent powered by **LangGraph**. The agent handles natural language requests for creating slide outlines, drafting slides, refining slide decks (inserting/modifying/removing content), and general Q&A.

### Graph Workflow

- **classify_intent**: Determines if the request is to create a new deck, edit the current deck, or chat.
- **propose_outline & draft_slides**: Outline proposal and concurrent multi-slide drafting loops.
- **refine_deck**: Applies targeted natural language updates to the existing deck state.
- **validate**: Evaluates slide deck outputs against strict schemas and count constraints, triggering correction cycles.
- **general_chat**: Serves conversational answers for non-deck inquiries.

See [graph_structure.md](graph_structure.md) for the visual representation and Mermaid code of the compiled LangGraph workflow.

To update the graph documentation, run:

```bash
PYTHONPATH=src uv run python -m slideia.domain.agent.graph
```

## Running Locally

To run the FastAPI development server:

```bash
uv run fastapi dev src/slideia/main.py --port 8000
```

## Testing

To run the test suite:

```bash
uv run --group test pytest
```
