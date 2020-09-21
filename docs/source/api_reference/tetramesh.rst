TetraMesh
=========

The ``TetraMesh`` widget represents a tetrahedron-based unstructured mesh.

You can either load a mesh from a ``vtk`` file (needs the vtk library installed),
or manually populate the vertices and tetrahedron data.

Example
-------

Load from a ``vtk`` file:

.. jupyter-execute::

    from ipygany import Scene, TetraMesh


    mesh = TetraMesh.from_vtk('assets/piston.vtu')

    scene = Scene([mesh])
    scene


Load from memory:

.. jupyter-execute::

    # Creating a brick with meshpy
    import numpy as np
    from meshpy.tet import MeshInfo, build


    mesh_info = MeshInfo()
    mesh_info.set_points([
        (0,0,0), (2,0,0), (2,2,0), (0,2,0),
        (0,0,12), (2,0,12), (2,2,12), (0,2,12),
    ])
    mesh_info.set_facets([
        [0,1,2,3],
        [4,5,6,7],
        [0,4,5,1],
        [1,5,6,2],
        [2,6,7,3],
        [3,7,4,0],
    ])
    mesh = build(mesh_info)

    mesh = TetraMesh(
        vertices=np.asarray(mesh.points),
        tetrahedron_indices=np.asarray(mesh.elements)
    )

    scene = Scene([mesh])
    scene
