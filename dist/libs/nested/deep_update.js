"use strict";
def;
deep_update(original, dict[Any, Any], update, dict[Any, Any]) -  > dict[Any, Any];
"";
";
Recursively;
merge;
two;
dicts, updating;
nested;
dicts;
instead;
of;
overwriting.
    Args;
original: The;
dictionary;
to;
update.
    update;
The;
dictionary;
containing;
updates;
to;
apply;
to `original`.
    Returns;
The `original`;
dictionary;
after;
applying;
updates;
from `update`.
    Note;
This;
method;
modifies;
the `original`;
dictionary in place.
;
"";
";
for (key, value in update.items())
    : if (isinstance(value, dict))
        and;
key in original;
original[key] = deep_update(original.get(key, {}), value);
original[key] = value;
return original;
