from setuptools import find_packages, setup

setup(
    name='django-admin-locking',
    version='1.8.1',
    url='https://github.com/theatlantic/django-admin-locking',
    download_url='https://github.com/theatlantic/django-admin-locking/tarball/v1.8.0',
    license='BSD',
    description='Prevents users from overwriting each others changes in Django.',
    author='Josh West',
    packages=find_packages(exclude=['tests']),
    include_package_data=True,
    install_requires=['six'],
    zip_safe=False,
    keywords=['Django', 'admin', 'locking'],
    classifiers=[
        'Development Status :: 5 - Production/Stable',
        'Environment :: Web Environment',
        'Framework :: Django',
        'Framework :: Django :: 1.11',
        'Framework :: Django :: 2.0',
        'Framework :: Django :: 2.2',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: Python :: 3.7',
    ]
)
