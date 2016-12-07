How To Prepare/Run PMIS Console
=============================

Before doing anything else make sure you have these applications:

#. npm (https://nodejs.org/it/download/)
    This is used for running **bower** and downloading required libraries

#. git (https://git-scm.com/downloads)
    This is the SVN used for downloading and updating this repository


1. Get this source
---------------------

::

    $ git clone https://github.com/sangahco/pmis-console.git


2. Fetch Dependencies
-------------------------

Go inside the new folder (pmis-console) and execute these commands from a console::

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