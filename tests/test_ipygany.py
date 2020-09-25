import pytest

import numpy as np

from ipydatawidgets import NDArrayWidget

from ipygany import PolyMesh, Component

from .utils import get_test_assets


def test_data_access():
    vertices, triangles, data_1d, data_3d = get_test_assets()

    poly = PolyMesh(vertices=vertices, triangle_indices=triangles, data=[data_1d, data_3d])

    assert np.all(np.equal(poly['1d', 'x'].array, np.array([0., 0., 0.])))
    assert np.all(np.equal(poly['3d', 'y'].array, np.array([2., 2., 2.])))


def test_mesh_data_creation():
    vertices, triangles, data_1d, data_3d = get_test_assets()

    poly = PolyMesh(vertices=vertices, triangle_indices=triangles, data={
        '1d': [Component('x', np.array([0., 0., 0.]))],
        '2d': [Component('x', np.array([1., 1., 1.])), Component('y', np.array([2., 2., 2.]))]
    })

    assert np.all(np.equal(poly['1d', 'x'].array, np.array([0., 0., 0.])))
    assert np.all(np.equal(poly['2d', 'x'].array, np.array([1., 1., 1.])))
    assert np.all(np.equal(poly['2d', 'y'].array, np.array([2., 2., 2.])))

    poly = PolyMesh(vertices=vertices, triangle_indices=triangles, data={
        '1d': {'x': np.array([0., 0., 0.])},
        '2d': {'x': np.array([1., 1., 1.]), 'y': np.array([2., 2., 2.])}
    })

    assert np.all(np.equal(poly['1d', 'x'].array, np.array([0., 0., 0.])))
    assert np.all(np.equal(poly['2d', 'x'].array, np.array([1., 1., 1.])))
    assert np.all(np.equal(poly['2d', 'y'].array, np.array([2., 2., 2.])))


def test_component_creation():
    comp = Component('z', np.array([1., 2., 3.]))

    assert comp.name == 'z'
    assert comp.min == 1.
    assert comp.max == 3.

    comp = Component('z', NDArrayWidget(np.array([1., 2., 3.])))

    assert comp.name == 'z'
    assert comp.min == 1.
    assert comp.max == 3.
