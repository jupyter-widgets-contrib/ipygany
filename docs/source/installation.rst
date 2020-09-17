.. _installation:

Using conda
===========

.. code:: bash

    conda install -c conda-forge ipygany

If you want to load vtk files, it will be needed to install the vtk library, you can install it from conda-forge as well:

.. code:: bash

    conda install -c conda-forge vtk

Using pip
=========

.. code:: bash

    pip install ipygany
    jupyter nbextension enable --py --sys-prefix ipygany  # can be skipped for notebook 5.3 and above

If you want to load vtk files, it will be needed to install the vtk library.

JupyterLab extension
====================

If you have JupyterLab, you will also need to install the JupyterLab extension:

.. code:: bash

    jupyter labextension install @jupyter-widgets/jupyterlab-manager ipygany

Development installation
========================

For a development installation (requires npm):

.. code:: bash

    git clone https://github.com/jupyter-widgets/ipygany.git
    cd ipygany
    pip install -e .
    jupyter nbextension install --py --symlink --sys-prefix ipygany
    jupyter nbextension enable --py --sys-prefix ipygany
    jupyter labextension install @jupyter-widgets/jupyterlab-manager .  # If you are developing on JupyterLab
