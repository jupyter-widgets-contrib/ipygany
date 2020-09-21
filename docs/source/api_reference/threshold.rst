Threshold
=========

The ``Threshold`` widget hides part of your mesh for which the does not fit in a given range.

The ``input`` attribute should be the name of the ``Component`` you want to use for hiding the mesh. You also need to pass the ``min`` and ``max`` of that the component should respect.

For example, if you have a 1-D ``Data`` named ``"height"``, you can simply pass its name as input:

.. code::

    threshold_mesh = Threshold(mesh, input='height')

If you have a 3-D ``Data``, you will need to pass the right component name, by passing a tuple containing (data name, component name):

.. code::

    threshold_mesh = Threshold(mesh, input=('displacement', 'z'))


Examples
--------

.. jupyter-execute::

    from ipywidgets import FloatSlider, VBox, jslink
    from ipygany import Scene, IsoColor, TetraMesh, Threshold

    # Load a Piston mesh, which contains displacement data
    mesh = TetraMesh.from_vtk('assets/piston.vtu')

    # Colorize the mesh by the dX displacement
    colored_mesh = IsoColor(mesh, input=('RESU____DEPL', 'DX'), min=-1.39e-06, max=1.39e-06)

    # Hides part of the mesh
    threshold_mesh = Threshold(colored_mesh, input=('RESU____DEPL', 'DX'), min=-1.39e-06, max=1.0e-07)

    # Create a slider that will dynamically change the threshold boundary
    threshold_slider = FloatSlider(value=0., min=0, max=1.0e-07)

    jslink((threshold_mesh, 'max'), (threshold_slider, 'value'))

    VBox((Scene([threshold_mesh]), threshold_slider))

.. jupyter-execute::

    import numpy as np
    from ipywidgets import FloatSlider, VBox, jslink
    from ipygany import Scene, Threshold, PolyMesh, Component


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

    height_min = np.min(z)
    height_max = np.max(z)

    # Hide parts of the mesh
    threshold_mesh = Threshold(mesh, input='height', min=height_min, max=height_max)

    # Create a slider that will dynamically change the boundaries of the threshold
    threshold_slider_min = FloatSlider(value=height_min, min=-0.3, max=1.)
    threshold_slider_max = FloatSlider(value=height_max, min=-0.3, max=1.)

    jslink((threshold_mesh, 'min'), (threshold_slider_min, 'value'))
    jslink((threshold_mesh, 'max'), (threshold_slider_max, 'value'))

    VBox((Scene([threshold_mesh]), threshold_slider_min, threshold_slider_max))
