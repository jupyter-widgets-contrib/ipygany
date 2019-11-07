
# odysis

[![Build Status](https://travis-ci.org/martinRenou/odysis.svg?branch=master)](https://travis-ci.org/martinRenou/odysis)
[![codecov](https://codecov.io/gh/martinRenou/odysis/branch/master/graph/badge.svg)](https://codecov.io/gh/martinRenou/odysis)


Scientific Visualization in Jupyter

## Installation

You can install using `pip`:

```bash
pip install odysis
```

Or if you use jupyterlab:

```bash
pip install odysis
jupyter labextension install @jupyter-widgets/jupyterlab-manager
```

If you are using Jupyter Notebook 5.2 or earlier, you may also need to enable
the nbextension:
```bash
jupyter nbextension enable --py [--sys-prefix|--user|--system] odysis
```
