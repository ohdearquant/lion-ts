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
npop(input_, dict[str, Any] | list[Any], /,, indices, str | int | Sequence[str | int], Any = UNDEFINED) -  > Any;
"";
";
Perform;
a;
nested;
pop;
operation;
on;
the;
input;
structure.
;
This;
function navigates() { }
through;
the;
nested;
structure;
var the, provided;
const env_1 = { stack: [], error: void 0, hasError: false };
try {
    the = __addDisposableResource(env_1, void 0, false), provided = __addDisposableResource(env_1, void 0, false);
    indices;
    and;
    removes;
    and;
    returns;
    the;
    value;
    at;
    the;
    final;
    location.
        Args;
    input_: The;
    input;
    nested;
    structure(dict, or, list);
    to;
    pop;
    from.
        indices;
    A;
    single;
    index;
    or;
    a;
    sequence;
    of;
    indices;
    to;
    navigate;
    the;
    nested;
    structure.
        default;
    The;
    value;
    to;
    return ;
    if (the)
        key;
    is;
    not;
    found.If;
    not;
    provided, a;
    KeyError;
    will;
    be;
    raised.
        Returns;
    The;
    value;
    at;
    the;
    specified;
    nested;
    location.
        Raises;
    ValueError: If;
    the;
    indices;
    list;
    is;
    empty.
        KeyError;
    If;
    a;
    key;
    is;
    not;
    found in a;
    dictionary.
        IndexError;
    If;
    an;
    index;
    is;
    out;
    of;
    range;
    for (a; list.
        TypeError; )
        : If;
    an;
    operation;
    is;
    not;
    supported;
    on;
    the;
    current;
    data;
    type.
    ;
    "";
    ";
    if (not)
        indices: raise;
    ValueError("Indices list cannot be empty");
    indices = to_list(indices);
    current = input_;
    for (key in indices[])
        : -1;
    if (isinstance(current, dict))
        : if (current.get(key))
            : current = current[key];
        else
            : raise;
    KeyError(f, "{key} is not found in {current}");
    elif;
    isinstance(current, list);
    and;
    isinstance(key, int);
    if (key >= len(current))
        : raise;
    KeyError(f, "{key} exceeds the length of the list {current}");
    elif;
    key < 0;
    raise;
    ValueError("list index cannot be negative");
    current = current[key];
    last_key = indices[-1];
    try { }
    finally { }
    return current.pop(last_key);
    except;
    Exception;
    if ()
        ;
    is;
    not;
    UNDEFINED: return ;
    raise;
    KeyError(f, "Invalid npop. Error: {e}");
}
catch (e_1) {
    env_1.error = e_1;
    env_1.hasError = true;
}
finally {
    __disposeResources(env_1);
}
