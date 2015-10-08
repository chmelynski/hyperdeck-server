# we can use os.getcwd() to dynamically distinguigh between development and production
# in development, os.getcwd() => '/cygdrive/c/Users/Adam/Desktop/frce/mysite'
# i don't know what it is in production, but it ain't that
import os

#developmentServer = (os.getcwd() == '/cygdrive/c/Users/Adam/Desktop/frce/mysite')
developmentServer = (os.getcwd() != '/app');

noahDev = os.getenv('griddlDev');

if developmentServer:
	DEBUG = True
	TEMPLATE_DEBUG = DEBUG
elif noahDev:
	DEBUG = True
	TEMPLATE_DEBUG = DEBUG
else:
	DEBUG = True
	TEMPLATE_DEBUG = DEBUG

ADMINS = (
	# ('Your Name', 'your_email@example.com'),
        ("Noah Hall", "noah.t.hall@gmail.com")
)

MANAGERS = ADMINS

# ENGINE : 'postgresql_psycopg2' , 'mysql' , 'sqlite3' , 'oracle'
# NAME : dbname for postgres, path to sqlite file for sqlite
# HOST : Empty for localhost through domain sockets or '127.0.0.1' for localhost through TCP
# PORT : Set to empty string for default

# how do we get different apps to use the different databases below?  right now, they all use 'default', and i don't know how to change it
# file:///C:/Users/Adam/Desktop/django-docs-1.5-en/topics/db/multi-db.html

if developmentServer:
	DATABASES = {
		'default' : {
			'ENGINE' : 'django.db.backends.sqlite3' , 
			'NAME' : 'C:/cygwin64/home/adam/frce/mysite/db.sqlite3'
		}
	}
elif noahDev:
	DATABASES = {
		'default' : {
			'ENGINE' : 'django.db.backends.sqlite3' , 
			'NAME' : '/var/www/griddl/db.sqlite3'
		}
	}

else:
	import dj_database_url
	DATABASES = { 'default' : dj_database_url.config() }
	#DATABASES = {
	#	'default' : {
	#		'ENGINE' : 'django.db.backends.postgresql_psycopg2' ,
	#		'NAME' : 'griddl' ,
	#		'USER' : env['DOTCLOUD_DB_SQL_LOGIN'],
	#		'PASSWORD' : env['DOTCLOUD_DB_SQL_PASSWORD'],
	#		'HOST' : env['DOTCLOUD_DB_SQL_HOST'],
	#		'PORT' : int(env['DOTCLOUD_DB_SQL_PORT'])
	#	}
	#}

#DATABASE_ROUTERS = [ 'path.to.AuthRouter' , 'path.to.MasterSlaveRouter' ]

# Hosts/domain names that are valid for this site; required if DEBUG is False
# See https://docs.djangoproject.com/en/1.5/ref/settings/#allowed-hosts
ALLOWED_HOSTS = []

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# In a Windows environment this must be set to your system time zone.
TIME_ZONE = 'America/New_York'

# Language code for this installation. All choices can be found here: http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'
# ??
SITE_ID = 1
# If you set this to False, Django will make some optimizations so as not to load the internationalization machinery.
USE_I18N = True
# If you set this to False, Django will not format dates, numbers and calendars according to the current locale.
USE_L10N = True
# If you set this to False, Django will not use timezone-aware datetimes.
USE_TZ = True
# Absolute filesystem path to the directory that will hold user-uploaded files. Example: "/var/www/example.com/media/"
MEDIA_ROOT = ''
# URL that handles the media served from MEDIA_ROOT. Make sure to use a trailing slash. Examples: "http://example.com/media/", "http://media.example.com/"
MEDIA_URL = ''

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/var/www/example.com/static/"

#if developmentServer:
#	STATIC_ROOT = ''
#else:
#	STATIC_ROOT = '/home/dotcloud/volatile/static/'

# not sure what heroku demands for this


# URL prefix for static files.
# Example: "http://example.com/static/", "http://static.example.com/"
# Additional locations of static files
# Put strings here, like "/home/html/static" or "C:/www/django/static".
# Always use forward slashes, even on Windows.
# Don't forget to use absolute paths, not relative paths.
#'c:/users/adam/desktop/frce/mysite/griddl/static' #will this break a production push?

if developmentServer:
	STATIC_ROOT = ''
	STATIC_URL = '/static/'
	STATICFILES_DIRS = ()
else:
	#STATIC_ROOT = '/app/griddl/static'
	STATIC_ROOT = 'staticfiles'
	STATIC_URL = '/static/'
	STATICFILES_DIRS = ( os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static'), )
	#STATICFILES_DIRS = ()

STATICFILES_STORAGE = 'whitenoise.django.GzipManifestStaticFilesStorage'

# List of finder classes that know how to find static files in various locations.
STATICFILES_FINDERS = (
	'django.contrib.staticfiles.finders.FileSystemFinder',
	'django.contrib.staticfiles.finders.AppDirectoriesFinder',
#    'django.contrib.staticfiles.finders.DefaultStorageFinder',
)

# Make this unique, and don't share it with anybody.
# todo: this should ideally come from getenv
SECRET_KEY = 'slvy^mosip%vo8atr69t)g$=vyhtmqggm8^w7#*e$_&^mj1261'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
	'django.template.loaders.filesystem.Loader',
	'django.template.loaders.app_directories.Loader',
#     'django.template.loaders.eggs.Loader',
)

TEMPLATE_DIRS = (
	# Put strings here, like "/home/html/django_templates" or "C:/www/django/templates".
	# Always use forward slashes, even on Windows.
	# Don't forget to use absolute paths, not relative paths.
)

MIDDLEWARE_CLASSES = (
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
	'django.contrib.contenttypes',
	'django.contrib.sessions',
	'django.contrib.sites',
	'django.contrib.messages',
	
	'django.contrib.staticfiles', # enable static files
	'django.contrib.admin', # enable admin
	# 'django.contrib.admindocs', # enable admin documentation
	
	'griddl',
#	'south',
	#'rest_framework'
)

SESSION_SERIALIZER = 'django.contrib.sessions.serializers.JSONSerializer'

#REST_FRAMEWORK = {
#	# Use hyperlinked styles by default.
#	# Only used if the `serializer_class` attribute is not set on a view.
#	'DEFAULT_MODEL_SERIALIZER_CLASS':
#		'rest_framework.serializers.HyperlinkedModelSerializer',
#	
#	# Use Django's standard `django.contrib.auth` permissions,
#	# or allow read-only access for unauthenticated users.
#	'DEFAULT_PERMISSION_CLASSES': [
#		'rest_framework.permissions.DjangoModelPermissionsOrAnonReadOnly'
#	]
#}

# A sample logging configuration.
# The only tangible logging performed by this configuration is to send an email to the site admins on every HTTP 500 error when DEBUG=False.
# See http://docs.djangoproject.com/en/dev/topics/logging for more details on how to customize your logging configuration.
LOGGING = {
	'version': 1,
	'disable_existing_loggers': False,
	'filters': {
		'require_debug_false': {
			'()': 'django.utils.log.RequireDebugFalse'
		}
	},
	'handlers': {
		'mail_admins': {
			'level': 'ERROR',
			'filters': ['require_debug_false'],
			'class': 'django.utils.log.AdminEmailHandler'
		}
	},
	'loggers': {
		'django.request': {
			'handlers': ['mail_admins'],
			'level': 'ERROR',
			'propagate': True,
		},
	}
}

