IsoColor
========

The ``IsoColor`` widget colorize your mesh given.

.. note::
    Currently, you can only use the default Viridis colormap, we'd like to support all paraview colormaps

The ``input`` attribute should be the name of the ``Component`` you want to use for colorizing the mesh. You also need to pass the ``min`` and ``max`` of the component array.

For example, if you have a 1-D ``Data`` named ``"height"``, you can simply pass its name as input:

.. code::

    isocolor_mesh = IsoColor(mesh, input='height')

If you have a 3-D ``Data``, you will need to pass the right component name, by passing a tuple containing (data name, component name):

.. code::

    isocolor_mesh = IsoColor(mesh, input=('displacement', 'z'))


Examples
--------

.. jupyter-execute::

    import numpy as np
    from ipywidgets import FloatSlider, VBox, jslink
    from ipygany import Scene, IsoColor, PolyMesh, Component


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

    # Colorize by height
    colored_mesh = IsoColor(mesh, input='height', min=height_min, max=height_max)

    # Create a slider that will dynamically change the boundaries of the colormap
    colormap_slider = FloatSlider(value=height_max, min=0., max=height_max)

    jslink((colored_mesh, 'max'), (colormap_slider, 'value'))

    VBox((Scene([colored_mesh]), colormap_slider))
