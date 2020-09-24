import pytest

import numpy as np

from ipydatawidgets import NDArrayWidget

from ipygany import PolyMesh, Data, Component


vertices = np.array([
    [0., 0., 0.],
    [0., 0., 0.],
    [0., 0., 0.],
])

triangles = np.array([
    [0, 1, 2],
])

data_1d = Data(name='1d', components=[Component('x', np.array([0., 0., 0.]))])
data_3d = Data('3d', [
    Component(name='x', array=np.array([1., 1., 1.])),
    Component('y', np.array([2., 2., 2.])),
    Component('z', np.array([3., 3., 3.])),
])


def test_data_access():
    poly = PolyMesh(vertices=vertices, triangle_indices=triangles, data=[data_1d, data_3d])

    assert np.all(np.equal(poly['1d', 'x'].array, np.array([0., 0., 0.])))
    assert np.all(np.equal(poly['3d', 'y'].array, np.array([2., 2., 2.])))


def test_mesh_data_creation():
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
