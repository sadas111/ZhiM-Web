# -*- coding: utf-8 -*-
"""
Document Embedders
==================

Embedders for generating vector representations of text.
"""

from __future__ import annotations

from .base import BaseEmbedder
from .openai import OpenAIEmbedder

__all__ = [
    "BaseEmbedder",
    "OpenAIEmbedder",
]
