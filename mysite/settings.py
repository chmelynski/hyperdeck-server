# flake8: noqa
from __future__ import unicode_literals

import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

noahDev = os.getenv('griddlDev')
herokuDev = os.getenv('herokuDev')
staging = os.getenv('staging')
production = os.getenv('production')

if noahDev or herokuDev or staging:
    DEBUG = True
else:
    DEBUG = False

ADMINS = (
    ("Noah Hall", "noah.t.hall@gmail.com"),
    ("Adam Chmelynski", "adam.chmelynski@gmail.com")
)

MANAGERS = ADMINS

# ENGINE : 'postgresql_psycopg2' , 'mysql' , 'sqlite3' , 'oracle'
# NAME : dbname for postgres, path to sqlite file for sqlite
# HOST : Empty for localhost through domain sockets
#        or '127.0.0.1' for localhost through TCP
# PORT : Set to empty string for default

if noahDev:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': '/var/www/griddl/db.sqlite3'
        }
    }
else:
    import dj_database_url
    DATABASES = {'default': dj_database_url.config()}

# DATABASE_ROUTERS = [ 'path.to.AuthRouter' , 'path.to.MasterSlaveRouter' ]

# Hosts/domain names that are valid for this site; required if DEBUG is False
# See https://docs.djangoproject.com/en/1.5/ref/settings/#allowed-hosts
ALLOWED_HOSTS = ['hyperdeck.io','workbook.hyperdeck.io','sandbox.hyperdeck.io','www.hyperdeck.io']

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# In a Windows environment this must be set to your system time zone.
TIME_ZONE = 'America/New_York'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'
# ??
SITE_ID = 1
# If you set this to False, Django will make some optimizations so as not to
# load the internationalization machinery.
USE_I18N = True
# If you set this to False, Django will not format dates, numbers and calendars
# according to the current locale.
USE_L10N = True
# If you set this to False, Django will not use timezone-aware datetimes.
USE_TZ = True
# Absolute filesystem path to the directory that will hold user-uploaded files.
# Example: "/var/www/example.com/media/"
MEDIA_ROOT = ''
# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash. Examples: "http://example.com/media/"
MEDIA_URL = ''

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/var/www/example.com/static/"

# URL prefix for static files.
# Example: "http://example.com/static/", "http://static.example.com/"
# Additional locations of static files
# Put strings here, like "/home/html/static" or "C:/www/django/static".
# Always use forward slashes, even on Windows.
# Don't forget to use absolute paths, not relative paths.

# STATIC_ROOT = '/app/griddl/static'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATIC_URL = '/static/'
STATICFILES_DIRS = (os.path.join(os.path.dirname(
                        os.path.abspath(__file__)), 'static'), )

# STATICFILES_STORAGE = 'whitenoise.django.GzipManifestStaticFilesStorage'
STATICFILES_STORAGE = 'pipeline.storage.PipelineCachedStorage'

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    #    'django.contrib.staticfiles.finders.DefaultStorageFinder',
    'pipeline.finders.PipelineFinder',
)

# Make this unique, and don't share it with anybody.
# todo: this should ideally come from getenv
SECRET_KEY = 'slvy^mosip%vo8atr69t)g$=vyhtmqggm8^w7#*e$_&^mj1261'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'griddl/templates')],  # override for password_reset templates
        'APP_DIRS': True,
        'OPTIONS': {
            'debug': DEBUG,
            'context_processors': [
                'django.contrib.auth.context_processors.auth',
                'django.template.context_processors.debug',
                'django.template.context_processors.i18n',
                'django.template.context_processors.media',
                'django.template.context_processors.static',
                'django.template.context_processors.tz',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

MIDDLEWARE_CLASSES = (
    'subdomains.middleware.SubdomainMiddleware',
    'subdomains.middleware.SubdomainURLRoutingMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    # Uncomment the next line for simple clickjacking protection:
    # 'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

ROOT_URLCONF = 'mysite.urls'

# Python dotted path to the WSGI application used by Django's runserver.
WSGI_APPLICATION = 'mysite.wsgi.application'

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.admin',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # 'django.contrib.admindocs', # enable admin documentation

    'stored_messages', # django-stored-messages
    'bootstrap3',      # django-bootstrap3
    'crispy_forms',    # django-crispy-forms
    'password_reset',  # django-password-reset
    'pipeline',        # django-pipeline

    'griddl',
    'billing'
)

# workaround for migration problem
AUTH_USER_MODEL = 'auth.User'

# crispy_forms setting
CRISPY_TEMPLATE_PACK = 'bootstrap3'

SESSION_SERIALIZER = 'django.contrib.sessions.serializers.JSONSerializer'

# See http://docs.djangoproject.com/en/dev/topics/logging for more details
# on how to customize your logging configuration.

# this is quickly going to force us to adopt a mutiple-settings-file approach
# or risk madness, maybe both
if noahDev:
    default_handler = 'file'
else:
    default_handler = 'stdout'

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse'
        }
    },
    'formatters': {
        'verbose': {
            'format': "[%(asctime)s] %(levelname)s \
                       [%(name)s:%(lineno)s] %(message)s",
            'datefmt': "%d/%b/%Y %H:%M:%S"
        },
        'simple': {
            'format': '%(levelname)s - %(message)s'
        },
    },
    'handlers': {
        'mail_admins': {
            'level': 'ERROR',
            'filters': ['require_debug_false'],
            'class': 'django.utils.log.AdminEmailHandler'
        },
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR + '/app.log',
            'formatter': 'verbose'
        },
        'stdout': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',

        }
    },
    'loggers': {
        'django': {
            'handlers': ['mail_admins'],
            'level': 'ERROR',
            'propagate': True,
        },
        'griddl': {
            'handlers': [default_handler],
            'level': 'DEBUG',
            'propagate': False,
        },
        'billing': {
            'handlers': [default_handler],
            'level': 'DEBUG',
            'propagate': True,
        }
    }
}

# todo: this password needs to not be in the file...
API_CREDENTIALS = {
    'fastspring': {
        'company': 'adamchmelynski',
        'login': 'adam.chmelynski+fsapi@gmail.com',
        'password':  os.getenv('FASTSPRING_PASSWD', False)
    }
}

LOGIN_URL = '/login'
LOGIN_REDIRECT_URL = '/auth/success'

MAX_WORKBOOK_SIZE = 524288000  # 500MB?

# stored_messages settings:
#  why doesn't this have a default anyway dang
MESSAGE_STORAGE = 'stored_messages.storage.PersistentStorage'

# email settings / impt for password_reset
# NB: also used on live to notify admins of Error-level log messages
EMAIL_BACKEND = 'postmark.django_backend.EmailBackend'
POSTMARK_SENDER = 'admin@hyperdeck.io'
DEFAULT_FROM_EMAIL = 'admin@hyperdeck.io' # password reset uses this, not sure who reads POSTMARK_SENDER
if noahDev or herokuDev:  # don't waste our free emails on dev
    POSTMARK_TEST_MODE = True
else:
    POSTMARK_API_KEY = os.getenv("POSTMARK_API_KEY", False)

REMOVE_WWW_FROM_DOMAIN = False

# subdomain settings
SUBDOMAINS = {
    'main': 'www',
    'sandbox': 'sandbox',
    'notWorkbook': 'www', # at some point delete main and rename notWorkbook->main
    'workbook': 'www'
}

if noahDev or herokuDev:
    SUBDOMAINS = {
        'main': 'dev',
        'sandbox': 'griddl-dev',
        'notWorkbook': 'dev',
        'workbook': 'dev'
    }

if staging:
    SUBDOMAINS = {
        'main': 'staging',
        'sandbox': 'griddl-staging',
        'notWorkbook': 'staging',
        'workbook': 'staging'
    }

SUBDOMAIN_URLCONFS = {
    SUBDOMAINS['main']: 'mysite.urls',
    SUBDOMAINS['sandbox']: 'mysite.urls',
} 

SECURE_SSL_REDIRECT = (production == 'TRUE')
SESSION_COOKIE_SECURE = (production == 'TRUE')
CSRF_COOKIE_SECURE = (production == 'TRUE')

# session is cross-subdomain unless that's too insecure
SESSION_COOKIE_DOMAIN = ".hyperdeck.io"
SESSION_COOKIE_NAME = SUBDOMAINS['main'] + 'sessionid'

PIPELINE = {
    'PIPELINE_ENABLED': staging or production, # True = compress
    'JS_COMPRESSOR': 'pipeline.compressors.uglifyjs.UglifyJSCompressor',
    'UGLIFYJS_BINARY': os.path.join(BASE_DIR, 'node_modules', '.bin', 'uglifyjs'),
    'UGLIFYJS_ARGUMENTS': '--mangle --mangle-props --mangle-regex="/^_/"',
    'DISABLE_WRAPPER': True, # by default, output is wrapped in an anonymous function
    'JAVASCRIPT': {
        'hyperdeck': {
            'source_filenames': (
              'griddl/js/components.js',
              'griddl/js/components/code.js',
              'griddl/js/components/data.js',
              'griddl/js/components/file.js',
              'griddl/js/components/repl.js',
              'griddl/js/components/link.js',
            ),
            'output_filename': 'griddl/js/hyperdeck.min.js',
        },
    },
}
