import os

# It's important to configure datajoint before importing spyglass
import datajoint as dj
DJ_DATABASE_HOST = os.environ.get("DJ_DATABASE_HOST", None)
if DJ_DATABASE_HOST is None:
    raise Exception("Please set DJ_DATABASE_HOST environment variable")
DJ_DATABASE_USER = os.environ.get("DJ_DATABASE_USER", None)
if DJ_DATABASE_USER is None:
    raise Exception("Please set DJ_DATABASE_USER environment variable")
DJ_DATABASE_PASSWORD = os.environ.get("DJ_DATABASE_PASSWORD", None)
if DJ_DATABASE_PASSWORD is None:
    raise Exception("Please set DJ_DATABASE_PASSWORD environment variable")
dj.config['database.host'] = DJ_DATABASE_HOST
dj.config['database.user'] = DJ_DATABASE_USER
dj.config['database.password'] = DJ_DATABASE_PASSWORD

os.environ['DJ_SUPPORT_FILEPATH_MANAGEMENT'] = 'TRUE'
