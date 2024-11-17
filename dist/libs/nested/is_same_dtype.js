"use strict";
def;
is_same_dtype(input_, list[Any] | dict[Any, Any], dtype, type | None, None, return_dtype, bool = False) -  > bool | tuple[bool, type | None];
"";
";
Check;
if (all)
    elements in a;
list;
or;
dict;
values;
are;
of;
the;
same;
data;
type.
    Args;
input_: The;
input;
list;
or;
dictionary;
to;
check.
    dtype;
The;
data;
against.If;
None, uses;
the;
first;
element.
    return_dtype;
If;
True, ;
return the;
data;
type;
with (the)
    check;
result.
    Returns;
If;
return_dtype;
is;
False, returns;
True;
if (all)
    elements;
are;
of;
the;
same;
type(or);
if (the)
    input;
is;
empty;
False;
otherwise.
;
If;
return_dtype;
is;
True, returns;
a;
tuple(bool, type | None).
;
"";
";
if (not)
    input_: return True;
iterable = input_.values();
if (isinstance(input_, dict))
    ;
else
    input_;
first_element_type = type(next(iter(iterable), None));
dtype = dtype;
or;
first_element_type;
result = all(isinstance(element, dtype));
for (element in iterable)
    return (result, dtype);
if (return_dtype)
    ;
else
    result;
