How To Prepare/Run PMIS Console
=============================

Before doing anything else make sure you have these applications:

#. npm
    This is used for running **bower** and downloading required libraries
#. git
    This is the SVN used for downloading and updating this repository


Execute these commands from a console::

    $ npm install
    $ git submodule update

``npm install`` will install the necessary modules, ``bower`` and ``bower-installer``
and will prepare the root folder with necessary dependencies.

``git submodule update`` will retrieve some AngularJS commons libraries from our git repository
used by this application.

The following folders will be created under the root folder:

node_modules (*only development*)
    Used in order to run bower, but not required in production.

bower_components (*only development*)
    Used by bower to take libraries, used only when you prepare the folder, 
    not required to run the application.

libs
    Contains the libraries required by the application (jquery,bootstrap,angular).