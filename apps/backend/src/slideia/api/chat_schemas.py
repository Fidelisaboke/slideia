"""Pydantic models for the chat streaming endpoint."""

from pydantic import BaseModel, Field


class ChatMessageSchema(BaseModel):
    """A single message in the conversation history."""

    role: str = Field(
        ...,
        pattern=r"^(user|assistant)$",
        description="Message author: 'user' or 'assistant'.",
    )
    content: str = Field(..., min_length=1, description="Message text content.")


class ChatRequest(BaseModel):
    """
    JSON payload sent alongside optional file attachments.

    Submitted as the 'payload' field in a multipart/form-data request.
    """

    prompt: str = Field(
        ...,
        min_length=1,
        max_length=10_000,
        description="The user's current message / instruction.",
    )
    conversation_history: list[ChatMessageSchema] = Field(
        default_factory=list,
        max_length=50,
        description="Prior messages for multi-turn context (most-recent last).",
    )
