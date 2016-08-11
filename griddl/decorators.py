import logging
from functools import wraps

from django.http import HttpResponseForbidden
from django.utils.decorators import available_attrs

from mysite.settings import SUBDOMAINS

logger = logging.getLogger(__name__)


def require_subdomain(subdomain=SUBDOMAINS['main']):
    '''
    enforce views only respond to requests on the specified subdomain.

    defaults to the "main" subdomain defined in settings, but it is
    preferable to always specify when calling the decorator.
    '''
    def decorator(func):
        @wraps(func, assigned=available_attrs(func))
        def inner(request, *args, **kwargs):
            if not request.subdomain == subdomain:
                fmt_args = (subdomain, request.subdomain, request.path)
                fmt_str = 'Request on wrong subdomain: \
                           Required: {}, got: {}, path: {}'
                logger.warning(fmt_str.format(*fmt_args))
                return HttpResponseForbidden()
            return func(request, *args, **kwargs)
        return inner
    return decorator

def exclude_subdomain(subdomain=SUBDOMAINS['sandbox']):
    '''
    enforce views to not respond to requests on the specified subdomain.

    defaults to the "sandbox" subdomain defined in settings, but it is
    preferable to always specify when calling the decorator.
    '''
    def decorator(func):
        @wraps(func, assigned=available_attrs(func))
        def inner(request, *args, **kwargs):
            if request.subdomain == subdomain:
                fmt_args = (subdomain, request.subdomain, request.path)
                fmt_str = 'Request on wrong subdomain: \
                           Required: {}, got: {}, path: {}'
                logger.warning(fmt_str.format(*fmt_args))
                return HttpResponseForbidden()
            return func(request, *args, **kwargs)
        return inner
    return decorator
