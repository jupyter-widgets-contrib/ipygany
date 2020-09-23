import pytest

import numpy as np

from ipygany import PolyMesh, Data, Component


vertices = np.array([
    [0., 0., 0.],
    [0., 0., 0.],
    [0., 0., 0.],
])

triangles = np.array([
    [0, 1, 2],
])

data_1d = Data(name='1d', components=[Component(name='x', array=np.array([0., 0., 0.]))])
data_3d = Data(name='3d', components=[
    Component(name='x', array=np.array([1., 1., 1.])),
    Component(name='y', array=np.array([2., 2., 2.])),
    Component(name='z', array=np.array([3., 3., 3.])),
])


def test_data_access():
    poly = PolyMesh(vertices=vertices, triangle_indices=triangles, data=[data_1d, data_3d])

    assert np.all(np.equal(poly['1d', 'x'].array, np.array([0., 0., 0.])))
    assert np.all(np.equal(poly['3d', 'y'].array, np.array([2., 2., 2.])))
