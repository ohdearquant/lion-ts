
def nget(
    nested_structure: dict[Any, Any] | list[Any],
    /,
    indices: list[int | str],
    default: Any = UNDEFINED,
) -> Any:
    try:
        target_container = get_target_container(nested_structure, indices[:-1])
        last_index = indices[-1]

        if (
            isinstance(target_container, list)
            and isinstance(last_index, int)
            and last_index < len(target_container)
        ):
            return target_container[last_index]
        elif isinstance(target_container, dict) and last_index in target_container:
            return target_container[last_index]
        elif default is not UNDEFINED:
            return default
        else:
            raise LookupError("Target not found and no default value provided.")
    except (IndexError, KeyError, TypeError):
        if default is not UNDEFINED:
            return default
        else:
            raise LookupError("Target not found and no default value provided.")


def nget(
    nested_structure: dict[Any, Any] | list[Any],
    /,
    indices: list[int | str],
    default: Any = UNDEFINED,
) -> Any:
    try:
        target_container = get_target_container(nested_structure, indices[:-1])
        last_index = indices[-1]

        if (
            isinstance(target_container, list)
            and isinstance(last_index, int)
            and last_index < len(target_container)
        ):
            return target_container[last_index]
        elif isinstance(target_container, dict) and last_index in target_container:
            return target_container[last_index]
        elif default is not UNDEFINED:
            return default
        else:
            raise LookupError("Target not found and no default value provided.")
    except (IndexError, KeyError, TypeError):
        if default is not UNDEFINED:
            return default
        else:
            raise LookupError("Target not found and no default value provided.")
