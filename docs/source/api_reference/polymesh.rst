PolyMesh
========

The ``PolyMesh`` widget represents a triangle-based unstructured mesh.

You can either load a mesh from a ``vtk`` file (needs the vtk library installed),
or manually populate the vertices and triangle data.

Example
-------

Load from a ``vtk`` file:

.. jupyter-execute::

    from ipygany import Scene, PolyMesh


    mesh = PolyMesh.from_vtk('source/assets/fastscapelib_topo.vtk')

    scene = Scene([mesh])
    scene


Load from memory:

.. jupyter-execute::

    import numpy as np


    # Create triangle indices
    Nr = 100
    Nc = 100

    triangle_indices = np.empty((Nr - 1, Nc - 1, 2, 3), dtype=int)

    r = np.arange(Nr * Nc).reshape(Nr, Nc)

    triangle_indices[:, :, 0, 0] = r[:-1, :-1]
    triangle_indices[:, :, 1, 0] = r[:-1, 1:]
    triangle_indices[:, :, 0, 1] = r[:-1, 1:]

    triangle_indices[:, :, 1, 1] = r[1:, 1:]
    triangle_indices[:, :, :, 2] = r[1:, :-1, None]

    triangle_indices.shape = (-1, 3)

    # Create vertices
    x = np.arange(-5, 5, 0.1)
    y = np.arange(-5, 5, 0.1)

    xx, yy = np.meshgrid(x, y, sparse=True)

    z = np.sin(xx**2 + yy**2) / (xx**2 + yy**2)

    vertices = np.empty((100, 100, 3))
    vertices[:, :, 0] = xx
    vertices[:, :, 1] = yy
    vertices[:, :, 2] = z
    vertices = vertices.reshape(10000, 3)

    mesh = PolyMesh(
        vertices=vertices,
        triangle_indices=triangle_indices
    )

    scene = Scene([mesh])
    scene
