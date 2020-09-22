PyVista
=======

https://docs.pyvista.org

PyVista is a great library that exposes a high level API for vtk, it has way more features
than ipygany. For this reason, ipygany supports PyVista objects:


.. jupyter-execute::

    import pyvista as pv
    from pyvista import examples

    pvmesh = examples.download_st_helens()
    ugrid = pvmesh.cast_to_unstructured_grid()

    from ipygany import PolyMesh, Scene, IsoColor, Warp

    # Turn the PyVista mesh into a PolyMesh
    mesh = PolyMesh.from_vtk(ugrid)
    warped_mesh = Warp(mesh, input=(0, 0, ('Elevation', 'X1')), warp_factor=1.)
    colored_mesh = IsoColor(warped_mesh, input='Elevation', min=682, max=2543)

    Scene([colored_mesh])


.. jupyter-execute::

    import pyvista as pv
    from pyvista import examples

    nefertiti = examples.download_nefertiti()
    ugrid = nefertiti.cast_to_unstructured_grid()

    from ipygany import PolyMesh, Scene, IsoColor, Warp

    # Turn the PyVista mesh into a PolyMesh
    mesh = PolyMesh.from_vtk(ugrid)
    mesh.default_color = 'gray'

    Scene([mesh])
