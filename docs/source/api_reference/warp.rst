Warp
====

The ``Warp`` widget will modify the mesh geometry.

It is similar to ``Paraview``, ``PyVista`` and ``vtk``'s warp-by-vector effect, but instead of computing the transformation on the CPU,
it is entirely computed on the GPU. Which means that changing the warp factor does not involve looping over the mesh vertices,
we only send the new ``factor`` value to the GPU.

The ``input`` attribute should be a 3-D tuple containing ``Components`` names or floating point values. For example, if your mesh has a 3-D ``Data`` named ``"displacement"``, your can set the input to be:

.. code::

    warped_mesh = Warp(mesh, input='displacement')

If you only want to visualize the last component of your displacement data, simply set the other two components to ``0``:

.. code::

    warped_mesh = Warp(mesh, input=(0, 0, ('displacement', 'z')))

If your mesh contains a 1-D ``Data``, you can also warp using this data by setting it to the wanted dimension:

.. code::

    x_warped_mesh = Warp(mesh, input=('height', 0, 0))  # Warp by 'height' data on the x-axis
    z_warped_mesh = Warp(mesh, input=(0, 0, 'height'))  # Warp by 'height' data on the z-axis


Examples
--------

.. jupyter-execute::

    from ipywidgets import FloatSlider, VBox, jslink
    from ipygany import Scene, IsoColor, TetraMesh, Warp

    # Load a Piston mesh, which contains displacement data
    mesh = TetraMesh.from_vtk('assets/piston.vtu')

    # Colorize the mesh by the dX displacement
    colored_mesh = IsoColor(mesh, input=('RESU____DEPL', 'DX'), min=-1.39e-06, max=1.39e-06)

    # Warp by the displacement data (dX, dY, dZ)
    warped_mesh = Warp(colored_mesh, input='RESU____DEPL', factor=300)

    # Create a slider that will dynamically change the warp factor value
    warp_slider = FloatSlider(value=300, min=0, max=800)

    jslink((warped_mesh, 'factor'), (warp_slider, 'value'))

    VBox((Scene([warped_mesh]), warp_slider))

You can also combine it with other effects like ``Threshold``:

Like other ipygany's effects, you can combine it with other effects. Here we applied an ``IsoColor`` effect, followed by a ``Warp`` effect, and we finally apply a ``Threshold`` effect that will hide parts of the mesh where ``dX`` ∉ [-1.39e-06, 1.0e-07]:

.. jupyter-execute::

    from ipywidgets import FloatRangeSlider
    from ipygany import Threshold


    threshold_mesh = Threshold(warped_mesh, input=('RESU____DEPL', 'DX'), min=-1.39e-06, max=1.0e-07)

    VBox((Scene([threshold_mesh]), warp_slider))

.. jupyter-execute::

    import numpy as np
    from ipygany import Scene, PolyMesh, Component, IsoColor


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

    height_component = Component(name='value', array=z)

    mesh = PolyMesh(
        vertices=vertices,
        triangle_indices=triangle_indices,
        data={'height': [height_component]}
    )

    # Colorize by curvature
    colored_mesh = IsoColor(mesh, input='height', min=np.min(z), max=np.max(z))
    warped_mesh = Warp(colored_mesh, input=(0, 0, 'height'))

    # Create a slider that will dynamically change the warp factor value
    warp_slider = FloatSlider(value=0, min=0, max=1)

    jslink((warped_mesh, 'factor'), (warp_slider, 'value'))

    VBox((Scene([warped_mesh]), warp_slider))
