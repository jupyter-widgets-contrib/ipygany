# ipygany

3-D Scientific Visualization in Jupyter

## Installation

You can install using `pip`:

```bash
pip install ipygany
```

Or using `conda`:

```bash
conda install -c conda-forge ipygany
```

And if you use jupyterlab:

```bash
jupyter labextension install @jupyter-widgets/jupyterlab-manager ipygany
```

If you are using Jupyter Notebook 5.2 or earlier, you may also need to enable
the nbextension:
```bash
jupyter nbextension enable --py [--sys-prefix|--user|--system] ipygany
```

## Installation from sources

You can install using `pip`:

```bash
git clone https://github.com/martinRenou/ipygany
cd ipygany
pip install .
```

And if you use jupyterlab:

```bash
jupyter labextension install @jupyter-widgets/jupyterlab-manager
jupyter labextension install .
```

And you use the classical Jupyter:

```bash
jupyter nbextension install --py --symlink --sys-prefix ipygany
jupyter nbextension enable --py --sys-prefix ipygany
```
