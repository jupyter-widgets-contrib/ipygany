PyVista
=======

https://docs.pyvista.org

PyVista is a great library that exposes a high level API for ``vtk``
and it has way more features than ``ipygany``. For this reason,
``ipygany`` supports PyVista objects:


.. jupyter-execute::

    import pyvista as pv
    from pyvista import examples

    from ipygany import PolyMesh, Scene, IsoColor, Warp

    # Download a pyvista example and convert it to a PolyMesh
    pvmesh = examples.download_st_helens()
    mesh = PolyMesh.from_pyvista(pvmesh)

    # Plot it
    warped_mesh = Warp(mesh, input=(0, 0, ('Elevation', 'X1')), warp_factor=1.)
    colored_mesh = IsoColor(warped_mesh, input='Elevation', min=682, max=2543)
    Scene([colored_mesh])


.. jupyter-execute::

    import pyvista as pv
    from pyvista import examples

    from ipygany import PolyMesh, Scene, IsoColor, Warp

    # Download the pyvista nefertiti example and convert it to a PolyMesh
    nefertiti = examples.download_nefertiti()
    mesh = PolyMesh.from_pyvista(nefertiti)

    # Plot it
    mesh.default_color = 'gray'
    Scene([mesh])
