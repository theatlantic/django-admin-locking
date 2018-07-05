from setuptools import find_packages, setup

setup(
    name='django-admin-locking',
    version='1.5',
    url='https://github.com/joshmaker/django-admin-locking/',
    download_url='https://github.com/joshmaker/django-admin-locking/tarball/v1.5',
    license='BSD',
    description='Prevents users from overwriting each others changes in Django.',
    author='Josh West',
    packages=find_packages(),
    include_package_data=True,
    install_requires=[],
    zip_safe=False,
    keywords=['Django', 'admin', 'locking'],
    classifiers=[]
)
