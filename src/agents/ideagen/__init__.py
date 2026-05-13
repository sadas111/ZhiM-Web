"""
Idea Generation Agents
Agent system for generating research ideas based on notebook content
"""

from __future__ import annotations

from .idea_generation_workflow import IdeaGenerationWorkflow
from .material_organizer_agent import MaterialOrganizerAgent

__all__ = [
    "IdeaGenerationWorkflow",
    "MaterialOrganizerAgent",
]
