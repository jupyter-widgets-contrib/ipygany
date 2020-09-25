import numpy as np

from ipygany import Data, Component


def get_test_assets():
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

    return vertices, triangles, data_1d, data_3d
