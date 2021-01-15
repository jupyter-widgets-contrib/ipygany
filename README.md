<h1 align="center">ipygany</h1>
<h2 align="center"> Jupyter Interactive Widgets library for 3-D mesh analysis</h2>

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/QuantStack/ipygany/stable?filepath=examples)
[![Documentation](http://readthedocs.org/projects/ipygany/badge/?version=latest)](https://ipygany.readthedocs.io/en/latest/?badge=latest)

**ipygany is an early developer preview. Features and implementation are subject to change.**

Features
========

**ipygany** has many features including:

- **VTK loader** for displaying your computation results in the Jupyter Notebook
- **Structured and Unstructured grids** support
- 2-D cell based meshes support (quads, triangles...) as well as 3-D cell based meshes support (tetrahedrons, quadratic tetrahedrons...)
- **Animations**
- **IsoColor** effect
- **Warp** effect
- **IsoSurface** computation
- **Threshold** effect (for visualizing only the parts that are inside of a range of data)
- **Point cloud** visualization
- **Water** effect, for nice water visualization with real-time caustics

Most of those features are **very fast**, because they are computed entirely on the GPU.

Documentation
=============

To get started with using `ipygany`, check out the full documentation

https://ipygany.readthedocs.io

Examples
========

**Animations:** Dynamically update the mesh from Python (data generated with https://fastscapelib.readthedocs.io)
![anim](https://user-images.githubusercontent.com/21197331/91716869-b607bd80-eb90-11ea-815b-2d2a73efa250.gif)

**IsoColor:** Use color mapping to highlight your data
![isocolor](https://user-images.githubusercontent.com/21197331/91716872-b738ea80-eb90-11ea-90fe-1906dc933e86.gif)

**Threshold:** Hide parts of your mesh
![threshold](https://user-images.githubusercontent.com/21197331/91716873-b738ea80-eb90-11ea-9401-c3789b6042e7.gif)

**Water effect:** Visualize your water flow data with a realistic water effect
![water](https://user-images.githubusercontent.com/21197331/91716875-b7d18100-eb90-11ea-9060-8bdc785df0fd.gif)

Installation
============

You can install **ipygany** with conda:

```bash
conda install -c conda-forge ipygany
```

Or using pip:

```bash
pip install ipygany
jupyter nbextension enable --py --sys-prefix ipygany
```

If you want to load vtk files in `ipygany`, you also need to install vtk, you can install it with conda:

```bash
conda install -c conda-forge vtk
```

For JupyterLab <= 2
-------------------

You need to install the labextension for **ipygany**:

```bash
jupyter labextension install @jupyter-widgets/jupyterlab-manager ipygany
```
