import numpy as np

from ipywidgets import Widget, widget_serialization


def array_to_binary(ar, obj=None, force_contiguous=True):
    if ar is None:
        return None
    if ar.dtype.kind not in ['u', 'i', 'f']:  # ints and floats
        raise ValueError("unsupported dtype: %s" % (ar.dtype))
    if ar.dtype == np.float64:  # WebGL does not support float64, case it here
        ar = ar.astype(np.float32)
    if ar.dtype == np.int64:  # JS does not support int64
        ar = ar.astype(np.int32)
    if force_contiguous and not ar.flags["C_CONTIGUOUS"]:  # make sure it's contiguous
        ar = np.ascontiguousarray(ar)
    return {'data': memoryview(ar), 'dtype': str(ar.dtype), 'shape': ar.shape}


def json_to_array(json, obj=None):
    return np.array(json)


def data_array_to_json(value, obj=None, force_contiguous=True):
    if isinstance(value, Widget):
        return widget_serialization['to_json'](value, obj)
    else:
        return array_to_binary(value, obj, force_contiguous)


array_serialization = dict(
    to_json=array_to_binary,
    from_json=json_to_array
)

data_array_serialization = dict(
    to_json=data_array_to_json
)
