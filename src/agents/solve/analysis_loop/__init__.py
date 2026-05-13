#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Analysis Loop - Analysis loop (Investigate → Note)
Deeply understand user questions, collect and organize knowledge
"""

from __future__ import annotations

from .investigate_agent import InvestigateAgent
from .note_agent import NoteAgent

__all__ = [
    "InvestigateAgent",
    "NoteAgent",
]
