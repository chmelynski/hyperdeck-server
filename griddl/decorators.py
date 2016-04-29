import logging
from functools import wraps

from django.http import HttpResponseForbidden
from django.utils.decorators import available_attrs

logger = logging.getLogger(__name__)


def require_subdomain(subdomain):
    '''
    enforce views only respond to requests on the specified subdomain.
    '''
    def decorator(func):
        @wraps(func, assigned=available_attrs(func))
        def inner(request, *args, **kwargs):
            if not request.subdomain == subdomain:
                fmt_args = (subdomain, request.subdomain, request.path)
                fmt_str = 'Request on wrong subdomain: \
                           Required {}, got {}, path{}'
                logger.warning(fmt_str.format(fmt_args))
                return HttpResponseForbidden()
            return func(request, *args, **kwargs)
        return decorator
