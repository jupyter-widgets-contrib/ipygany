#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Martin Renou.
# Distributed under the terms of the Modified BSD License.

from .colormaps import colormaps  # noqa
from .ipygany import (  # noqa
    PolyMesh, TetraMesh, PointCloud,
    Scene,
    Data, Component,
    Alpha, RGB, IsoColor, ColorBar,
    Threshold, IsoSurface,
    Warp, WarpByScalar,
    Water, UnderWater
)
from ._version import __version__, version_info  # noqa

from .nbextension import _jupyter_nbextension_paths  # noqa
