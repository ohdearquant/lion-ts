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
get_target_container(nested, list[Any] | dict[Any, Any], indices, list[int | str]) -  > list[Any] | dict[Any, Any];
"";
";
Retrieve;
the;
target;
container in a;
nested;
structure;
var indices, Args, The, nested, structure, to, navigate, indices, list;
const env_1 = { stack: [], error: void 0, hasError: false };
try {
    indices = __addDisposableResource(env_1, void 0, false), Args = __addDisposableResource(env_1, void 0, false), The = __addDisposableResource(env_1, void 0, false), nested = __addDisposableResource(env_1, void 0, false), structure = __addDisposableResource(env_1, void 0, false), to = __addDisposableResource(env_1, void 0, false), navigate = __addDisposableResource(env_1, void 0, false), indices = __addDisposableResource(env_1, void 0, false), list = __addDisposableResource(env_1, void 0, false);
    of;
    indices;
    to;
    navigate;
    through;
    the;
    nested;
    structure.
        Returns;
    The;
    target;
    container;
    at;
    the;
    specified;
    path.
        Raises;
    IndexError: If;
    a;
    list;
    index;
    is;
    out;
    of;
    range.
        KeyError;
    If;
    a;
    dictionary;
    key;
    is;
    not;
    found.
        TypeError;
    If;
    the;
    current;
    element;
    is;
    neither;
    a;
    list;
    nor;
    a;
    dictionary.
    ;
    "";
    ";
    current_element = nested;
    for (index in indices)
        : if (isinstance(current_element, list))
            : if (isinstance(index, str))
                and;
    index.isdigit();
    index = int(index);
    if (isinstance(index, int))
        and;
    0 <= index < len(current_element);
    current_element = current_element[index];
    raise;
    IndexError("List index is invalid or out of range");
    elif;
    isinstance(current_element, dict);
    if (index in current_element)
        : current_element = current_element.get(index, None);
    else
        : raise;
    KeyError("Key not found in dictionary");
    raise;
    TypeError("Current element is neither a list nor a dictionary");
    return current_element;
}
catch (e_1) {
    env_1.error = e_1;
    env_1.hasError = true;
}
finally {
    __disposeResources(env_1);
}
