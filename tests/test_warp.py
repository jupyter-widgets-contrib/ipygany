import pytest

from traitlets import TraitError

from ipygany import PolyMesh, Warp

from .utils import get_test_assets


def test_default_input():
    vertices, triangles, data_1d, data_3d = get_test_assets()

    poly = PolyMesh(vertices=vertices, triangle_indices=triangles, data=[data_1d, data_3d])

    warped_mesh = Warp(poly)

    assert warped_mesh.input == (('1d', 'x'), 0, 0)

    poly = PolyMesh(vertices=vertices, triangle_indices=triangles, data=[data_3d])

    warped_mesh = Warp(poly)

    assert warped_mesh.input == '3d'


def test_input():
    vertices, triangles, data_1d, data_3d = get_test_assets()

    poly = PolyMesh(vertices=vertices, triangle_indices=triangles, data=[data_1d, data_3d])

    warped_mesh = Warp(poly)

    with pytest.raises(TraitError):
        warped_mesh.input = (('1d', 'x'), 0)

    warped_mesh.input = ('1d', 0, 0)
    assert warped_mesh.input == (('1d', 'x'), 0, 0)

    warped_mesh.input = ('1d', 0, 32)
    assert warped_mesh.input == (('1d', 'x'), 0, 32)

    warped_mesh.input = (0, 0, '1d')
    assert warped_mesh.input == (0, 0, ('1d', 'x'))

    with pytest.raises(TraitError):
        warped_mesh.input = ('3d', 0, 0)

    warped_mesh = Warp(poly, input=('1d', 0, 0))
    assert warped_mesh.input == (('1d', 'x'), 0, 0)

    warped_mesh = Warp(poly, input=(0, 0, '1d'))
    assert warped_mesh.input == (0, 0, ('1d', 'x'))

    warped_mesh = Warp(warped_mesh, input=(0, '1d', 0))
    assert warped_mesh.input == (0, ('1d', 'x'), 0)
