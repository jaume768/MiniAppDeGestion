"""
Configuración específica para tests
"""
from .settings import *

# Usar SQLite en memoria para tests (más rápido y sin permisos)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Configuración para tests más rápidos
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Deshabilitar logging durante tests
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'null': {
            'class': 'logging.NullHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['null'],
            'level': 'INFO',
        },
    },
}

# Configuración de media para tests
MEDIA_ROOT = '/tmp/test_media/'

# Secret key para tests
SECRET_KEY = 'test-secret-key-not-for-production'

# Debug en tests
DEBUG = True

# Configuración de cache simple para tests
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}
