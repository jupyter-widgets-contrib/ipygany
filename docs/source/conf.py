# -*- coding: utf-8 -*-
import sphinx_rtd_theme


def setup(app):
    app.add_css_file("main_stylesheet.css")


extensions = [
    'jupyter_sphinx',
]

templates_path = ['_templates']

master_doc = 'index'
source_suffix = '.rst'

# General information about the project.
project = 'ipygany'
author = 'jupyter-widgets-contrib'

exclude_patterns = []
highlight_language = 'python'
pygments_style = 'sphinx'

# Output file base name for HTML help builder.
html_theme = "sphinx_rtd_theme"
html_theme_path = [sphinx_rtd_theme.get_html_theme_path()]
htmlhelp_basename = 'ipyganydoc'
html_static_path = []
