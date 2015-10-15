import logging
from django.shortcuts import render
logger = logging.getLogger(__name__)

def activate(request):
        '''FastSpring Notifications endpoint -- Subscription Activation'''
        logger.debug(request.GET)
        pass

def change(request):
        '''FastSpring Notifications endpoint -- Subscription Change'''
        logger.debug(request.GET)
        pass

def deactivate(request):
        '''FastSpring Notifications endpoint -- Subscription Deactivation'''
        logger.debug(request.GET)
        pass

def payfail(request):
        '''FastSpring Notifications endpoint -- Subscription Payment Failure'''
        logger.debug(request.GET)
        pass
