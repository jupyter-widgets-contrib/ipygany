Warp
====

The ``Warp`` widget will modify the mesh geometry.

It is similar to ``Paraview``, ``PyVista`` and ``vtk``'s warp-by-vector effect, but instead of computing the transformation on the CPU,
it is entirely computed on the GPU. Which means that changing the warp factor does not involve looping over the mesh vertices,
we only send the new ``factor`` value to the GPU.

Example
-------

.. jupyter-execute::

    from ipywidgets import FloatSlider, VBox, jslink
    from ipygany import Scene, IsoColor, TetraMesh, Warp

    # Load a Piston mesh, which contains displacement data
    mesh = TetraMesh.from_vtk('source/assets/piston.vtu')

    # Colorize the mesh by the dX displacement
    colored_mesh = IsoColor(mesh, input=('RESU____DEPL', 'DX'), min=-1.39e-06, max=1.39e-06)

    # Warp by the displacement data (dX, dY, dZ)
    warped_mesh = Warp(colored_mesh, input='RESU____DEPL', factor=300)

    # Create a slider that will dynamically change the warp factor value
    warp_slider = FloatSlider(value=300, min=0, max=500)

    jslink((warped_mesh, 'factor'), (warp_slider, 'value'))

    VBox((Scene([warped_mesh]), warp_slider))


Combined with other widgets
---------------------------

Like other ipygany's effects, you can combine it with other effects. Here we applied an ``IsoColor`` effect, followed by a ``Warp`` effect, and we finally apply a ``Threshold`` effect that will hide parts of the mesh where ``dX`` ∉ [-1.39e-06, 1.0e-07]:

.. jupyter-execute::

    from ipywidgets import FloatRangeSlider
    from ipygany import Threshold


    threshold_mesh = Threshold(warped_mesh, input=('RESU____DEPL', 'DX'), min=-1.39e-06, max=1.0e-07)

    VBox((Scene([threshold_mesh]), warp_slider))
