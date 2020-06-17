<h1 align="center">ipygany</h1>
<h2 align="center"> Jupyter Interactive Widgets library for 3-D mesh analysis</h2>


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

For JupyterLab
--------------

You need to install the labextension for **ipygany**:

```bash
jupyter labextension install @jupyter-widgets/jupyterlab-manager ipygany
```
