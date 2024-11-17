"use strict";
def;
is_homogeneous(iterables, list[Any] | dict[Any, Any], type_check, type | tuple[type, ], ...) -  > bool;
"";
";
Check;
if (all)
    elements in a;
list;
or;
all;
values in a;
dict;
are;
of;
same;
type.
    Args;
iterables: The;
list;
or;
dictionary;
to;
check.
    type_check;
The;
against.
    Returns;
True;
if (all)
    elements / values;
are;
of;
the;
same;
type, False;
otherwise.
;
"";
";
if (isinstance(iterables, list))
    : return all(isinstance(it, type_check));
for (it in iterables)
    elif;
isinstance(iterables, dict);
return all(isinstance(val, type_check));
for (val in iterables.values())
    ;
return isinstance(iterables, type_check);
