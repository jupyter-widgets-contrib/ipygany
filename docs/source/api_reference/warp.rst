Warp
====

.. jupyter-execute::

    from ipygany import Scene, TetraMesh, Warp

    mesh = TetraMesh.from_vtk('../assets/piston.vtu')

    warped_mesh = Warp(mesh)

    scene = Scene([warped_mesh])
    scene
