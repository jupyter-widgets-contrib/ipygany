Data
====

Before applying any effect to your mesh, you will need to load node data.

The ``Data`` and ``Component`` widgets represents the node data for an unstructured mesh.

- A ``Data`` widget is made of a ``name`` property and a list of components. As an example, a temperature ``Data`` (1D) would be made of a list of one ``Component``, a displacement ``Data`` (3D) would be made of a list of three ``Components``.

- A ``Component`` widget is made of a ``name`` property and an ``array`` property.

Those data are loaded automatically when loading a mesh from a vtk file.
If you manually create a ``PolyMesh`` or a ``TetraMesh``, you will need to
manually create the node data.

Example
-------

When loading a vtk file, the ``Data`` and ``Component`` widgets are created automatically from
the node data in the file:

.. jupyter-execute::

    from ipygany import TetraMesh


    mesh = TetraMesh.from_vtk('assets/piston.vtu')

    for data in mesh.data:
        print(data.name, ':', [component.name for component in data.components])


When loading a mesh from memory, you will need to manually pass your node data:


.. jupyter-execute::

    import numpy as np
    from ipygany import Scene, PolyMesh, Component, IsoColor


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

    height_component = Component(name='value', array=z)

    mesh = PolyMesh(
        vertices=vertices,
        triangle_indices=triangle_indices,
        data={'height': [height_component]}
    )

    # Colorize by curvature
    colored_mesh = IsoColor(mesh, input=('height', 'value'), min=np.min(z), max=np.max(z))

    scene = Scene([colored_mesh])
    scene
