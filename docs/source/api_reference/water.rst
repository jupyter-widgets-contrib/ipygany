Water
=====

ipygany provides a ``Water`` widget that displays your mesh using reflection and refraction of the environment. It also provides an ``UnderWater`` widget for all meshes that are under-water, ipygany will cast caustics on these under-water meshes.

Unlike most of the ipygany effects, the ``Water`` widget has no input. You simply create it by passing the mesh on which you want to apply the effect:

.. code::

    water_mesh = Water(mesh)

If you have under-water meshes on which you want to cast caustics, you need to create an ``UnderWater`` widget for each for them. The input must be a 1-D component specifying if the node is under-water or not.

.. code::

    underwater_mesh = UnderWater(mesh, input='underwater')

Then you'll need to pass those under-water meshes to the water effect:

.. code:: Python

    underwater_mesh1 = UnderWater(mesh1, input='underwater')
    underwater_mesh2 = UnderWater(mesh2, input='underwater')

    water_mesh = Water(mesh, under_water_blocks=[underwater_mesh1, underwater_mesh2])

You can find a full example Notebook here: https://github.com/martinRenou/proteus_visualization/blob/master/reef.ipynb

.. image:: water.gif
   :alt: water
