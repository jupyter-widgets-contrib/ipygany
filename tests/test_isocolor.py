import pytest

from traitlets import TraitError

from ipygany import PolyMesh, IsoColor

from .utils import get_test_assets


def test_default_input():
    vertices, triangles, data_1d, data_3d = get_test_assets()

    poly = PolyMesh(vertices=vertices, triangle_indices=triangles, data=[data_1d, data_3d])

    colored_mesh = IsoColor(poly)

    assert colored_mesh.input == '1d'

    poly = PolyMesh(vertices=vertices, triangle_indices=triangles, data=[data_3d])

    colored_mesh = IsoColor(poly)

    assert colored_mesh.input == (('3d', 'x'), )


def test_input():
    vertices, triangles, data_1d, data_3d = get_test_assets()

    poly = PolyMesh(vertices=vertices, triangle_indices=triangles, data=[data_1d, data_3d])

    colored_mesh = IsoColor(poly)

    colored_mesh.input = ('1d', )
    assert colored_mesh.input == (('1d', 'x'), )

    colored_mesh.input = ('3d', 'x')
    assert colored_mesh.input == ('3d', 'x')

    colored_mesh.input = (3.2, )
    assert colored_mesh.input == (3.2, )

    colored_mesh.input = 3.2
    assert colored_mesh.input == 3.2
