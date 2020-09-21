.. _usage-section:

Usage
=====

``ipygany`` provides a set of tools for loading and analyzing 3D meshes in the Jupyter Notebook.

Loading your mesh in the Notebook
---------------------------------

``ipygany`` provides a ``PolyMesh`` class for loading triangle-based meshes, and a ``TetraMesh`` class for tetrahedron-based meshes.

You can either use vtk to load your meshes, or manually pass vertices buffers.

You need to create a 3D ``Scene`` widget in order to display your loaded mesh in the page.

.. jupyter-execute::

    from ipygany import Scene, PolyMesh

    mesh = PolyMesh.from_vtk('assets/fastscapelib_topo.vtk')
    mesh.default_color = 'gray'

    scene = Scene([mesh])
    scene


Applying effects to your mesh
-----------------------------

You can apply multiple effects to your mesh for quick analysis, most of those effects are performed on the GPU, hence are super fast.

.. jupyter-execute::

    from ipygany import IsoColor, Warp

    colored_mesh = IsoColor(mesh, input='H', min=0., max=1003.)
    warped_mesh = Warp(colored_mesh, input=(0, 0, ('H', 'X1')), warp_factor=0.)

    scene2 = Scene([warped_mesh])
    scene2


You can then control some parameters using other widgets:

.. jupyter-execute::

    from ipywidgets import FloatSlider, jslink

    warp_slider = FloatSlider(value=0., min=0., max=3.)

    jslink((warped_mesh, 'factor'), (warp_slider, 'value'))

    warp_slider
