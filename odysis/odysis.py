"""Scientific Visualization in Jupyter."""

from array import array

from traitlets import (
    Unicode, List, Instance, Float
)
from traittypes import Array
from ipywidgets import (
    widget_serialization,
    DOMWidget, Widget,
    Color
)
import vtk

from .serialization import array_serialization
from .vtk_loader import (
    load_vtk, FLOAT32, UINT32,
    get_ugrid_vertices, get_ugrid_triangles, get_ugrid_tetrahedrons, get_ugrid_data
)

from ._frontend import module_version, module_name


class _OdysisWidgetBase(Widget):
    _view_module = Unicode(module_name).tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)

    _view_module_version = Unicode(module_version).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)


class _OdysisDOMWidgetBase(DOMWidget):
    _view_module = Unicode(module_name).tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)

    _view_module_version = Unicode(module_version).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)


class Component(_OdysisWidgetBase):
    """A data component widget."""

    _model_name = Unicode('ComponentModel').tag(sync=True)

    name = Unicode().tag(sync=True)
    array = Array(default_value=array(FLOAT32)).tag(sync=True, **array_serialization)

    min = Float(allow_none=True, default_value=None).tag(sync=True)
    max = Float(allow_none=True, default_value=None).tag(sync=True)


class Data(_OdysisWidgetBase):
    """A data widget."""

    _model_name = Unicode('DataModel').tag(sync=True)

    name = Unicode().tag(sync=True)
    components = List(Instance(Component)).tag(sync=True, **widget_serialization)


def _grid_data_to_data_widget(grid_data):
    """Turn a vtk grid into a Data widget."""
    data = []
    for key, value in grid_data.items():
        d = Data(
            name=key,
            components=[
                Component(name=comp_name, array=comp['array'], min=comp['min'], max=comp['max'])
                for comp_name, comp in value.items()
            ]
        )
        data.append(d)

    return data


class Mesh(_OdysisWidgetBase):
    """A 3-D Mesh widget."""

    _model_name = Unicode('MeshModel').tag(sync=True)

    vertices = Array(default_value=array(FLOAT32)).tag(sync=True, **array_serialization)
    triangle_indices = Array(default_value=array(UINT32)).tag(sync=True, **array_serialization)
    tetrahedron_indices = Array(default_value=array(UINT32)).tag(sync=True, **array_serialization)
    # data = List(Instance(Data), default_value=[]).tag(sync=True, **widget_serialization)
    default_color = Color('#6395b0').tag(sync=True)

    @staticmethod
    def from_vtk(path):
        """Pass a path to a VTK Unstructured Grid file (``.vtu``) or pass a ``vtkUnstructuredGrid`` object to use.

        Parameters
        ----------
        path : str or vtk.vtkUnstructuredGrid
            The path to the VTK file or an unstructured grid in memory.
        """
        if isinstance(path, str):
            grid = load_vtk(path)
        elif isinstance(path, vtk.vtkUnstructuredGrid):
            grid = path
        elif hasattr(path, "cast_to_unstructured_grid"):
            # Allows support for any PyVista mesh
            grid = path.cast_to_unstructured_grid()
        else:
            raise TypeError("Only unstructured grids supported at this time.")

        return Mesh(
            vertices=get_ugrid_vertices(grid),
            triangle_indices=get_ugrid_triangles(grid),
            tetrahedron_indices=get_ugrid_tetrahedrons(grid),
            # data=_grid_data_to_data_widget(get_ugrid_data(grid))
        )

    def reload(self, path, reload_vertices=False, reload_triangles=False, reload_data=True, reload_tetrahedrons=False):
        """Reload a vtk file, entirely or partially."""
        grid = load_vtk(path)

        with self.hold_sync():
            if reload_vertices:
                self.vertices = get_ugrid_vertices(grid)
            if reload_triangles:
                self.triangle_indices = get_ugrid_triangles(grid)
            if reload_tetrahedrons:
                self.tetrahedron_indices = get_ugrid_tetrahedrons(grid)
            # if reload_data:
            #     self.data = _grid_data_to_data_widget(get_ugrid_data(grid))


class Scene(_OdysisDOMWidgetBase):
    """A 3-D Scene widget."""

    _view_name = Unicode('SceneView').tag(sync=True)
    _model_name = Unicode('SceneModel').tag(sync=True)

    meshes = List(Instance(Mesh)).tag(sync=True, **widget_serialization)

    background_color = Color('#fff').tag(sync=True)
