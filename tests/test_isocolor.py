import pytest

from ipygany import PolyMesh, IsoColor
from ipygany.colormaps import colormaps

from .utils import get_test_assets


def test_default_input():
    vertices, triangles, data_1d, data_3d = get_test_assets()

    poly = PolyMesh(vertices=vertices, triangle_indices=triangles, data=[data_1d, data_3d])

    colored_mesh = IsoColor(poly, colormap='Turbo')

    assert colored_mesh.input == '1d'

    poly = PolyMesh(vertices=vertices, triangle_indices=triangles, data=[data_3d])

    colored_mesh = IsoColor(poly)

    assert colored_mesh.input == (('3d', 'x'), )


def test_colormaps():
    vertices, triangles, data_1d, data_3d = get_test_assets()

    poly = PolyMesh(vertices=vertices, triangle_indices=triangles, data=[data_1d, data_3d])

    colored_mesh = IsoColor(poly, colormap='Turbo')
    assert colored_mesh.colormap == colormaps.Turbo

    colormap = colormaps.Cividis
    colored_mesh.colormap = colormap
    assert colored_mesh.colormap == colormap

    with pytest.raises(ValueError):
        colored_mesh.colormap = 'InvalidColor'

    with pytest.raises(ValueError):
        colored_mesh.colormap = -1


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
