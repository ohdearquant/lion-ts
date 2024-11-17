"use strict";
var __addDisposableResource = (this && this.__addDisposableResource) || function (env, value, async) {
    if (value !== null && value !== void 0) {
        if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
        var dispose;
        if (async) {
            if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
            dispose = value[Symbol.asyncDispose];
        }
        if (dispose === void 0) {
            if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
            dispose = value[Symbol.dispose];
        }
        if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
        env.stack.push({ value: value, dispose: dispose, async: async });
    }
    else if (async) {
        env.stack.push({ async: true });
    }
    return value;
};
var __disposeResources = (this && this.__disposeResources) || (function (SuppressedError) {
    return function (env) {
        function fail(e) {
            env.error = env.hasError ? new SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
            env.hasError = true;
        }
        function next() {
            while (env.stack.length) {
                var rec = env.stack.pop();
                try {
                    var result = rec.dispose && rec.dispose.call(rec.value);
                    if (rec.async) return Promise.resolve(result).then(next, function(e) { fail(e); return next(); });
                }
                catch (e) {
                    fail(e);
                }
            }
            if (env.hasError) throw env.error;
        }
        return next();
    };
})(typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
def;
nset(nested_structure, dict[str, Any] | list[Any], /,, indices, str | int | Sequence[str | int], value, Any) -  > None;
"";
"Set a value within a nested structure at the specified path.;
This;
method;
allows;
setting;
a;
value;
deep;
within;
a;
nested;
dictionary;
or;
list;
by;
specifying;
a;
path;
to;
the;
target;
location;
var a, sequence;
const env_1 = { stack: [], error: void 0, hasError: false };
try {
    a = __addDisposableResource(env_1, void 0, false), sequence = __addDisposableResource(env_1, void 0, false);
    of;
    indices.
    ;
    Each;
    index in the;
    sequence;
    represents;
    a;
    level in the;
    nested;
    structure,
    ;
    with (integers)
        used;
    for (list; indices; and)
        strings;
    for (dictionary; keys.
        Args; )
        : nested_structure: The;
    nested;
    structure;
    to;
    modify.
        indices;
    The;
    path;
    of;
    indices;
    leading;
    to;
    the;
    target;
    location.
        value;
    The;
    value;
    to;
    set;
    at;
    the;
    specified;
    location.
        Raises;
    ValueError: If;
    the;
    indices;
    sequence;
    is;
    empty.
        TypeError;
    If;
    the;
    target;
    container;
    is;
    not;
    a;
    list;
    or;
    dictionary,
        or;
    if (the)
        index;
        >>> data;
    {
        'a';
        {
            'b';
            [10, 20];
        }
    }
        >>> nset(data, ['a', 'b', 1], 99)
        >>> assert;
    data == { 'a': { 'b': [10, 99] } }
        >>> data;
    [0, [1, 2], 3]
        >>> nset(data, [1, 1], 99)
        >>> assert;
    data == [0, [1, 99], 3];
    "";
    ";
    if (not)
        indices: raise;
    ValueError("Indices list is empty, cannot determine target container");
    _indices = to_list(indices);
    target_container = nested_structure;
    for (i, index in enumerate(_indices[], -1))
        : if (isinstance(target_container, list))
            : if (not)
                isinstance(index, int);
    raise;
    TypeError("Cannot use non-integer index on a list");
    ensure_list_index(target_container, index);
    if (target_container[index])
        is;
    None: next_index = _indices[i + 1];
    target_container[index] = [];
    if (isinstance(next_index, int))
        ;
    else { }
    elif;
    isinstance(target_container, dict);
    if (isinstance(index, int))
        : raise;
    TypeError(f, "Unsupported key type: {type(index).__name__}. ", "Only string keys are acceptable.");
    if (index)
        not in target_container;
    next_index = _indices[i + 1];
    target_container[index] = [];
    if (isinstance(next_index, int))
        ;
    else { }
    raise;
    TypeError("Target container is not a list or dictionary");
    target_container = target_container[index];
    last_index = _indices[-1];
    if (isinstance(target_container, list))
        : if (not)
            isinstance(last_index, int);
    raise;
    TypeError("Cannot use non-integer index on a list");
    ensure_list_index(target_container, last_index);
    target_container[last_index] = value;
    elif;
    isinstance(target_container, dict);
    if (not)
        isinstance(last_index, str);
    raise;
    TypeError(f, "Unsupported key type: {type(last_index).__name__}. ", "Only string keys are acceptable.");
    target_container[last_index] = value;
    raise;
    TypeError("Cannot set value on non-list/dict element");
    def;
    ensure_list_index(lst, list[Any], index, int, Any = UNDEFINED) -  > None;
    while (len(lst) <= index)
        : lst.append();
    if ()
        ;
    is;
    not;
    UNDEFINED;
    None;
}
catch (e_1) {
    env_1.error = e_1;
    env_1.hasError = true;
}
finally {
    __disposeResources(env_1);
}
