WarpByScalar
============

The ``WarpByScalar`` widget will modify the mesh geometry.

It is similar to ``Paraview``, ``PyVista`` and ``vtk``'s warp-by-scalar effect, but instead of computing the transformation on the CPU,
it is entirely computed on the GPU. Which means that changing the warp factor does not involve looping over the mesh vertices,
we only send the new ``factor`` value to the GPU.

The ``input`` attribute should be a 1-D data. For example, if your mesh has a 1-D ``Data`` named ``"height"``, your can set the input to be:

.. code::

    warped_mesh = WarpByScalar(mesh, input='height')  # Warp by 'height' data


Examples
--------

.. code:: Python

    from pyvista import examples
    import numpy as np

    from ipywidgets import VBox, FloatSlider
    from ipygany import PolyMesh, Scene, IsoColor, WarpByScalar

    pvmesh = examples.download_topo_global()
    ugrid = pvmesh.cast_to_unstructured_grid()

    from ipygany import PolyMesh, Scene, IsoColor, WarpByScalar

    # Turn the PyVista mesh into a PolyMesh
    mesh = PolyMesh.from_vtk(ugrid)

    colored_mesh = IsoColor(mesh, min=-10421.0, max=6527.0)
    warped_mesh = WarpByScalar(colored_mesh, input='altitude', factor=0.5e-5)

    # Link a slider to the warp value
    warp_slider = FloatSlider(min=0., max=5., value=0.5)

    def on_slider_change(change):
        warped_mesh.factor = change['new'] * 1e-5

    warp_slider.observe(on_slider_change, 'value')

    VBox((warp_slider, Scene([warped_mesh])))

.. image:: warpscalar.gif
   :alt: warpscalar
