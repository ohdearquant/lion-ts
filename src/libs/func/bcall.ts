"""
Copyright 2024 HaiyangLi

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
"""

import asyncio
import functools
import logging
import time
from collections.abc import AsyncGenerator, Callable, Sequence
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache, wraps
from typing import Any, TypeVar

from .constants import UNDEFINED
from .parse import to_list
from .utils import time as _t

T = TypeVar("T")
F = TypeVar("F", bound=Callable[..., Any])


async def bcall(
    input_: Any,
    func: Callable[..., T],
    /,
    batch_size: int,
    num_retries: int = 0,
    initial_delay: float = 0,
    retry_delay: float = 0,
    backoff_factor: float = 1,
    retry_default: Any = None,
    retry_timeout: float | None = None,
    retry_timing: bool = False,
    verbose_retry: bool = True,
    error_msg: str | None = None,
    error_map: dict[type, Callable[[Exception], Any]] | None = None,
    max_concurrent: int | None = None,
    throttle_period: float | None = None,
    **kwargs: Any,
) -> AsyncGenerator[list[T | tuple[T, float]], None]:
    """
    Asynchronously call a function in batches with retry and timing options.

    Args:
        input_: The input data to process.
        func: The function to call.
        batch_size: The size of each batch.
        retries: The number of retries.
        initial_delay: Initial delay before the first attempt in seconds.
        delay: The delay between retries in seconds.
        backoff_factor: Factor by which delay increases after each retry.
        default: Default value to return if an error occurs.
        timeout: The timeout for the function call in seconds.
        timing: If True, return execution time along with the result.
        verbose: If True, print retry attempts and exceptions.
        error_msg: Custom error message prefix.
        error_map: Mapping of errors to handle custom error responses.
        max_concurrent: Maximum number of concurrent calls.
        throttle_period: Throttle period in seconds.
        **kwargs: Additional keyword arguments to pass to the function.

    Yields:
        A list of results for each batch of inputs.

    Examples:
        >>> async def sample_func(x):
        ...     return x * 2
        >>> async for batch_results in bcall([1, 2, 3, 4, 5], sample_func, 2,
        ...                                  retries=3, delay=1):
        ...     print(batch_results)
    """
    input_ = to_list(input_, flatten=True, dropna=True)

    for i in range(0, len(input_), batch_size):
        batch = input_[i : i + batch_size]  # noqa: E203
        batch_results = await alcall(
            batch,
            func,
            num_retries=num_retries,
            initial_delay=initial_delay,
            retry_delay=retry_delay,
            backoff_factor=backoff_factor,
            retry_default=retry_default,
            retry_timeout=retry_timeout,
            retry_timing=retry_timing,
            verbose_retry=verbose_retry,
            error_msg=error_msg,
            error_map=error_map,
            max_concurrent=max_concurrent,
            throttle_period=throttle_period,
            **kwargs,
        )
        yield batch_results

