
def get_target_container(
    nested: list[Any] | dict[Any, Any], indices: list[int | str]
) -> list[Any] | dict[Any, Any]:
    """
    Retrieve the target container in a nested structure using indices.

    Args:
        nested: The nested structure to navigate.
        indices: A list of indices to navigate through the nested structure.

    Returns:
        The target container at the specified path.

    Raises:
        IndexError: If a list index is out of range.
        KeyError: If a dictionary key is not found.
        TypeError: If the current element is neither a list nor a dictionary.
    """
    current_element = nested
    for index in indices:
        if isinstance(current_element, list):
            if isinstance(index, str) and index.isdigit():
                index = int(index)

            if isinstance(index, int) and 0 <= index < len(current_element):
                current_element = current_element[index]

            else:
                raise IndexError("List index is invalid or out of range")

        elif isinstance(current_element, dict):
            if index in current_element:
                current_element = current_element.get(index, None)
            else:
                raise KeyError("Key not found in dictionary")
        else:
            raise TypeError("Current element is neither a list nor a dictionary")
    return current_element
