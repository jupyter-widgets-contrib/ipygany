"""Scientific Visualization in Jupyter."""

from array import array

import numpy as np

from traitlets import (
    Bool, Dict, Unicode, List, Instance, CFloat, Tuple, Union, default, validate
)
from traittypes import Array
from ipywidgets import (
    widget_serialization,
    DOMWidget, Widget,
    Color, Image
)

from .serialization import array_serialization, data_array_serialization

from ._frontend import module_version, module_name

FLOAT32 = 'f'
UINT32 = 'I'


class _GanyWidgetBase(Widget):
    _model_module = Unicode(module_name).tag(sync=True)

    _model_module_version = Unicode(module_version).tag(sync=True)


class _GanyDOMWidgetBase(DOMWidget):
    _view_module = Unicode(module_name).tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)

    _view_module_version = Unicode(module_version).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)


class Component(_GanyWidgetBase):
    """A data component widget."""

    _model_name = Unicode('ComponentModel').tag(sync=True)

    name = Unicode().tag(sync=True)
    array = Union((Instance(Widget), Array())).tag(sync=True, **data_array_serialization)

    min = CFloat(allow_none=True, default_value=None)
    max = CFloat(allow_none=True, default_value=None)

    # TODO Compute min and max in the constructor?


class Data(_GanyWidgetBase):
    """A data widget."""

    _model_name = Unicode('DataModel').tag(sync=True)

    name = Unicode().tag(sync=True)
    components = List(Instance(Component)).tag(sync=True, **widget_serialization)

    def __getitem__(self, key):
        """Get a component by name or index."""
        if isinstance(key, str):
            for component in self.components:
                if component.name == key:
                    return component
            raise KeyError('Component {} not found.'.format(key))

        if isinstance(key, int):
            return self.components[key]

        raise KeyError('Invalid key {}.'.format(key))


def _grid_data_to_data_widget(grid_data):
    """Turn a vtk grid into Data widgets."""
    data = []
    for key, value in grid_data.items():
        d = Data(
            name=key,
            components=[
                Component(name=comp_name, array=comp['array'])
                for comp_name, comp in value.items()
            ]
        )
        data.append(d)

    return data


def _update_data_widget(grid_data, block_widget):
    """Update a given block widget with new grid data."""
    for data_name, data in grid_data.items():
        for component_name, component in data.items():
            component_widget = block_widget[data_name, component_name]
            component_widget.array = component['array']


class Block(_GanyWidgetBase):
    """A 3-D element widget.

    This class is not intended to be instantiated directly.
    """

    _model_name = Unicode('BlockModel').tag(sync=True)

    vertices = Union((Instance(Widget), Array()), default_value=array(FLOAT32)).tag(sync=True, **data_array_serialization)

    default_color = Color('#6395b0').tag(sync=True)

    data = Union((Dict(), List(Instance(Data)))).tag(sync=True, **widget_serialization)

    environment_meshes = List(Instance(Widget), default_value=[]).tag(sync=True, **widget_serialization)

    def __getitem__(self, key):
        """Get a component by name or index."""
        if not isinstance(key, tuple) or len(key) != 2:
            raise KeyError('You can only access data by (data_name, component_name) tuple.')

        data_name = key[0]
        component_name = key[1]

        if isinstance(data_name, str):
            for data in self.data:
                if data.name == data_name:
                    return data[component_name]
            raise KeyError('Data {} not found.'.format(data_name))

        if isinstance(data_name, int):
            return self.data[data_name][component_name]

        raise KeyError('Invalid key {}.'.format(key))

    @validate('data')
    def _validate_data(self, proposal):
        data = proposal['value']

        if isinstance(data, dict):
            return [Data(name=name, components=components) for name, components in data.items()]

        return data


class PolyMesh(Block):
    """A polygon-based 3-D Mesh widget."""

    _model_name = Unicode('PolyMeshModel').tag(sync=True)

    triangle_indices = Array(default_value=array(UINT32)).tag(sync=True, **array_serialization)

    def __init__(self, vertices=[], triangle_indices=[], data=[], **kwargs):
        """Construct a PolyMesh.

        A PolyMesh is a triangle-based mesh. ``vertices`` is the array of points, ``triangle_indices`` is the array of triangle
        indices.
        """
        if not isinstance(vertices, Widget):
            vertices = np.asarray(vertices).flatten()
        triangle_indices = np.asarray(triangle_indices).flatten()

        # If there are no triangle indices, assume vertices are given in the right order for constructing the triangles.
        if triangle_indices.size == 0:
            l_vertices = np.asarray(vertices.array).flatten().size if isinstance(vertices, Widget) else vertices.size

            triangle_indices = np.arange(l_vertices, dtype=np.uint32)

        super(PolyMesh, self).__init__(
            vertices=vertices, triangle_indices=triangle_indices, data=data, **kwargs
        )

    @staticmethod
    def from_vtk(path, **kwargs):
        """Pass a path to a VTK Unstructured Grid file (``.vtu``) or pass a ``vtkUnstructuredGrid`` object to use.

        Parameters
        ----------
        path : str or vtk.vtkUnstructuredGrid
            The path to the VTK file or an unstructured grid in memory.
        """
        import vtk

        from .vtk_loader import (
            load_vtk,
            get_ugrid_vertices, get_ugrid_triangles, get_ugrid_data
        )

        if isinstance(path, str):
            grid = load_vtk(path)
        elif isinstance(path, vtk.vtkUnstructuredGrid):
            grid = path
        elif hasattr(path, "cast_to_unstructured_grid"):
            # Allows support for any PyVista mesh
            grid = path.cast_to_unstructured_grid()
        else:
            raise TypeError("Only unstructured grids supported at this time.")

        return PolyMesh(
            vertices=get_ugrid_vertices(grid),
            triangle_indices=get_ugrid_triangles(grid),
            data=_grid_data_to_data_widget(get_ugrid_data(grid)),
            **kwargs
        )

    def reload(self, path, reload_vertices=False, reload_triangles=False, reload_data=True):
        """Reload a vtk file, entirely or partially."""
        from .vtk_loader import (
            load_vtk, get_ugrid_vertices, get_ugrid_triangles, get_ugrid_data
        )

        grid = load_vtk(path)

        with self.hold_sync():
            if reload_vertices:
                self.vertices = get_ugrid_vertices(grid)
            if reload_triangles:
                self.triangle_indices = get_ugrid_triangles(grid)
            if reload_data:
                _update_data_widget(get_ugrid_data(grid), self)


class TetraMesh(PolyMesh):
    """A tetrahedron-based 3-D Mesh widget."""

    _model_name = Unicode('TetraMeshModel').tag(sync=True)

    tetrahedron_indices = Array(default_value=array(UINT32)).tag(sync=True, **array_serialization)

    def __init__(self, vertices=[], triangle_indices=[], tetrahedron_indices=[], data=[], **kwargs):
        """Construct a TetraMesh.

        A TetraMesh is a tetrahedron-based mesh. ``vertices`` is the array of points, ``triangle_indices`` is the array of
        triangle indices defining the mesh "skin", and ``tetrahedron_indices`` are the indices for constructing the tetrahedrons.
        """
        triangle_indices = np.asarray(triangle_indices).flatten()
        tetrahedron_indices = np.asarray(tetrahedron_indices)

        # If the skin is not provided, we compute it
        if triangle_indices.size == 0:
            if tetrahedron_indices.ndim != 2:
                tetrahedron_indices.reshape(int(tetrahedron_indices.size / 4), 4)

            # Extract all the triangle indices
            faces = np.concatenate([
                tetrahedron_indices[:, [2, 1, 0]],
                tetrahedron_indices[:, [0, 3, 2]],
                tetrahedron_indices[:, [1, 3, 0]],
                tetrahedron_indices[:, [2, 3, 1]]
            ])

            # Sort triangles indices so that we can compare them and find duplicates
            sorted_faces = np.sort(faces, axis=1)

            # Get unique triangle indices and the number of times they appear
            _, unique_index, counts = np.unique(sorted_faces, return_index=True, return_counts=True, axis=0)

            # Extract triangles that appear exactly once
            triangle_indices = faces[unique_index[counts == 1]].flatten()

        super(TetraMesh, self).__init__(
            vertices=vertices, triangle_indices=triangle_indices,
            tetrahedron_indices=tetrahedron_indices.flatten(), data=data, **kwargs
        )

    @staticmethod
    def from_vtk(path, **kwargs):
        """Pass a path to a VTK Unstructured Grid file (``.vtu``) or pass a ``vtkUnstructuredGrid`` object to use.

        Parameters
        ----------
        path : str or vtk.vtkUnstructuredGrid
            The path to the VTK file or an unstructured grid in memory.
        """
        import vtk

        from .vtk_loader import (
            load_vtk, get_ugrid_vertices, get_ugrid_triangles, get_ugrid_tetrahedrons, get_ugrid_data
        )

        if isinstance(path, str):
            grid = load_vtk(path)
        elif isinstance(path, vtk.vtkUnstructuredGrid):
            grid = path
        elif hasattr(path, "cast_to_unstructured_grid"):
            # Allows support for any PyVista mesh
            grid = path.cast_to_unstructured_grid()
        else:
            raise TypeError("Only unstructured grids supported at this time.")

        return TetraMesh(
            vertices=get_ugrid_vertices(grid),
            triangle_indices=get_ugrid_triangles(grid),
            tetrahedron_indices=get_ugrid_tetrahedrons(grid),
            data=_grid_data_to_data_widget(get_ugrid_data(grid)),
            **kwargs
        )

    def reload(self, path, reload_vertices=False, reload_triangles=False, reload_data=True, reload_tetrahedrons=False):
        """Reload a vtk file, entirely or partially."""
        from .vtk_loader import (
            load_vtk, get_ugrid_vertices, get_ugrid_triangles, get_ugrid_tetrahedrons, get_ugrid_data
        )

        grid = load_vtk(path)

        with self.hold_sync():
            if reload_vertices:
                self.vertices = get_ugrid_vertices(grid)
            if reload_triangles:
                self.triangle_indices = get_ugrid_triangles(grid)
            if reload_tetrahedrons:
                self.tetrahedron_indices = get_ugrid_tetrahedrons(grid)
            if reload_data:
                _update_data_widget(get_ugrid_data(grid), self)


class PointCloud(Block):
    """A 3-D point-cloud widget."""

    _model_name = Unicode('PointCloudModel').tag(sync=True)

    def __init__(self, vertices=[], data=[], **kwargs):
        """Construct a PointCloud."""
        super(PointCloud, self).__init__(vertices=vertices, data=data, **kwargs)

    @staticmethod
    def from_vtk(path, **kwargs):
        """Pass a path to a VTK Unstructured Grid file (``.vtu``) or pass a ``vtkUnstructuredGrid`` object to use.

        Parameters
        ----------
        path : str or vtk.vtkUnstructuredGrid
            The path to the VTK file or an unstructured grid in memory.
        """
        import vtk

        from .vtk_loader import (
            load_vtk, get_ugrid_vertices, get_ugrid_data
        )

        if isinstance(path, str):
            grid = load_vtk(path)
        elif isinstance(path, vtk.vtkUnstructuredGrid):
            grid = path
        elif hasattr(path, "cast_to_unstructured_grid"):
            # Allows support for any PyVista mesh
            grid = path.cast_to_unstructured_grid()
        else:
            raise TypeError("Only unstructured grids supported at this time.")

        return PointCloud(
            vertices=get_ugrid_vertices(grid),
            data=_grid_data_to_data_widget(get_ugrid_data(grid)),
            **kwargs
        )

    def reload(self, path, reload_vertices=False, reload_data=True):
        """Reload a vtk file, entirely or partially."""
        from .vtk_loader import (
            load_vtk, get_ugrid_vertices, get_ugrid_data
        )

        grid = load_vtk(path)

        with self.hold_sync():
            if reload_vertices:
                self.vertices = get_ugrid_vertices(grid)
            if reload_data:
                _update_data_widget(get_ugrid_data(grid), self)


class Effect(Block):
    """An effect applied to another block.

    This class is not intended to be instantiated directly.
    """

    _model_name = Unicode('EffectModel').tag(sync=True)

    parent = Instance(Block).tag(sync=True, **widget_serialization)

    def __init__(self, parent, **kwargs):
        """Create an Effect on the given Mesh or Effect output."""
        super(Effect, self).__init__(parent=parent, **kwargs)


class Warp(Effect):
    """A warp effect to another block."""

    _model_name = Unicode('WarpModel').tag(sync=True)

    input = Union((Tuple(trait=Unicode, minlen=2, maxlen=2), Unicode(), CFloat(0.))).tag(sync=True)

    offset = Union((Tuple(trait=Unicode, minlen=3, maxlen=3), CFloat(0.)), default_value=0.).tag(sync=True)
    factor = Union((Tuple(trait=Unicode, minlen=3, maxlen=3), CFloat(0.)), default_value=1.).tag(sync=True)

    @default('input')
    def _default_input(self):
        return self.parent.data[0].name


class Alpha(Effect):
    """An transparency effect to another block."""

    _model_name = Unicode('AlphaModel').tag(sync=True)

    input = Union((Tuple(trait=Unicode, minlen=2, maxlen=2), Unicode(), CFloat(0.))).tag(sync=True)

    @default('input')
    def _default_input(self):
        return 0.7


class RGB(Effect):
    """A color effect to another block."""

    _model_name = Unicode('RGBModel').tag(sync=True)

    input = Union((Tuple(trait=Unicode, minlen=2, maxlen=2), Unicode(), CFloat(0.))).tag(sync=True)


class IsoColor(Effect):
    """An IsoColor effect to another block."""

    _model_name = Unicode('IsoColorModel').tag(sync=True)

    input = Union((Tuple(trait=Unicode, minlen=2, maxlen=2), Unicode(), CFloat(0.))).tag(sync=True)

    min = CFloat(0.).tag(sync=True)
    max = CFloat(0.).tag(sync=True)

    @default('input')
    def _default_input(self):
        return self.parent.data[0].name


class IsoSurface(Effect):
    """An IsoSurface effect to another block."""

    _model_name = Unicode('IsoSurfaceModel').tag(sync=True)

    input = Union((Tuple(trait=Unicode, minlen=2, maxlen=2), Unicode(), CFloat(0.))).tag(sync=True)

    value = CFloat(0.).tag(sync=True)
    dynamic = Bool(False).tag(sync=True)

    @default('input')
    def _default_input(self):
        return self.parent.data[0].name


class Threshold(Effect):
    """An Threshold effect to another block."""

    _model_name = Unicode('ThresholdModel').tag(sync=True)

    input = Union((Tuple(trait=Unicode, minlen=2, maxlen=2), Unicode(), CFloat(0.))).tag(sync=True)

    min = CFloat(0.).tag(sync=True)
    max = CFloat(0.).tag(sync=True)
    dynamic = Bool(False).tag(sync=True)

    @default('input')
    def _default_input(self):
        return self.parent.data[0].name


class UnderWater(Effect):
    """An nice UnderWater effect to another block."""

    _model_name = Unicode('UnderWaterModel').tag(sync=True)

    input = Union((Tuple(trait=Unicode, minlen=2, maxlen=2), Unicode())).tag(sync=True)

    default_color = Color('#F2FFD2').tag(sync=True)
    texture = Instance(Image, allow_none=True, default_value=None).tag(sync=True, **widget_serialization)
    texture_scale = CFloat(2.).tag(sync=True)
    texture_position = Tuple(minlen=2, maxlen=2, default_value=(1., 1., 0.)).tag(sync=True)

    @default('input')
    def _default_input(self):
        return self.parent.data[0].name


class Water(Effect):
    """An nice Water effect to another block."""

    _model_name = Unicode('WaterModel').tag(sync=True)

    under_water_blocks = List(Instance(UnderWater)).tag(sync=True, **widget_serialization)

    caustics_enabled = Bool(False).tag(sync=True)
    caustics_factor = CFloat(0.2).tag(sync=True)


class Scene(_GanyDOMWidgetBase):
    """A 3-D Scene widget."""

    _view_name = Unicode('SceneView').tag(sync=True)
    _model_name = Unicode('SceneModel').tag(sync=True)

    children = List(Instance(Block)).tag(sync=True, **widget_serialization)

    background_color = Color('white').tag(sync=True)
    background_opacity = CFloat(1.).tag(sync=True)

    def __init__(self, children=[], **kwargs):
        """Construct a Scene."""
        super(Scene, self).__init__(children=children, **kwargs)
