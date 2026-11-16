import json
def ser(v):
    if isinstance(v,bool): return "true" if v else "false"
    if isinstance(v,str): return json.dumps(v,ensure_ascii=False)
    if isinstance(v,(int,float)): return json.dumps(v)
    if isinstance(v,list): return "["+", ".join(ser(x) for x in v)+"]"
    if isinstance(v,dict): return "{ "+", ".join(f"{k}: {ser(x)}" for k,x in v.items())+" }"
    raise TypeError(v)
