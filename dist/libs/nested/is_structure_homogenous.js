"use strict";
def;
is_structure_homogeneous(structure, Any, return_structure_type, bool = False) -  > bool | tuple[bool, type | None];
"";
";
Check;
if (a)
    nested;
structure;
is;
homogeneous(no, mix, of, lists, and, dicts).
    Args;
structure: The;
nested;
structure;
to;
check.
    return_structure_type;
If;
True, ;
return the;
homogeneous;
structure.
    Returns;
If;
return_structure_type;
is;
False, returns;
True;
if (the)
    structure;
is;
homogeneous, False;
otherwise.
;
If;
True, returns;
a;
tuple(bool, type | None).
    Examples;
    >>> is_structure_homogeneous({ 'a': { 'b': 1 }, 'c': { 'd': 2 } });
True
    >>> is_structure_homogeneous({ 'a': { 'b': 1 }, 'c': [1, 2] });
False;
"";
";
def;
_check_structure(substructure);
structure_type = None;
if (isinstance(substructure, list))
    : structure_type = list;
for (item in substructure)
    : if (not)
        isinstance(item, structure_type);
and;
isinstance(item, list | dict);
return False, None;
result, _ = _check_structure(item);
if (not)
    result: return False, None;
elif;
isinstance(substructure, dict);
structure_type = dict;
for (item in substructure.values())
    : if (not)
        isinstance(item, structure_type);
and;
isinstance(item, list | dict);
return False, None;
result, _ = _check_structure(item);
if (not)
    result: return False, None;
return True, structure_type;
is_homogeneous, structure_type = _check_structure(structure);
return (is_homogeneous, structure_type);
if (return_structure_type)
    ;
else
    is_homogeneous;
