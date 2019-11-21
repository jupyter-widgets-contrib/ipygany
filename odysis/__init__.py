#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Martin Renou.
# Distributed under the terms of the Modified BSD License.

from .odysis import PolyMesh, TetraMesh, Scene, Data, Component, IsoColor, Threshold, IsoSurface
from ._version import __version__, version_info

from .nbextension import _jupyter_nbextension_paths
