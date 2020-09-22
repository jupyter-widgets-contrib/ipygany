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


    mesh = PolyMesh.from_vtk('assets/fastscapelib_topo.vtk')

    scene = Scene([mesh])
    scene


Load from memory:

.. jupyter-execute::

    import numpy as np


    # Create triangle indices
    nx = 100
    ny = 100

    triangle_indices = np.empty((ny - 1, nx - 1, 2, 3), dtype=int)

    r = np.arange(nx * ny).reshape(ny, nx)

    triangle_indices[:, :, 0, 0] = r[:-1, :-1]
    triangle_indices[:, :, 1, 0] = r[:-1, 1:]
    triangle_indices[:, :, 0, 1] = r[:-1, 1:]

    triangle_indices[:, :, 1, 1] = r[1:, 1:]
    triangle_indices[:, :, :, 2] = r[1:, :-1, None]

    triangle_indices.shape = (-1, 3)

    # Create vertices
    x = np.arange(-5, 5, 10/nx)
    y = np.arange(-5, 5, 10/ny)

    xx, yy = np.meshgrid(x, y, sparse=True)

    z = np.sin(xx**2 + yy**2) / (xx**2 + yy**2)

    vertices = np.empty((ny, nx, 3))
    vertices[:, :, 0] = xx
    vertices[:, :, 1] = yy
    vertices[:, :, 2] = z
    vertices = vertices.reshape(nx * ny, 3)

    mesh = PolyMesh(
        vertices=vertices,
        triangle_indices=triangle_indices
    )

    scene = Scene([mesh])
    scene
