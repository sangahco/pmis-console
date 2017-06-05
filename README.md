# Rainy Status Widget

Before doing anything else make sure you have these applications:

- [npm](https://nodejs.org/it/download/)
  > This is used for running **bower** and downloading required libraries

- [git](https://git-scm.com/downloads)
  > This is the SVN used for downloading and updating this repository

**`npm` and `git` are required during development only, they are not used in production!**


## 1. Get this source

```
$ git clone https://github.com/sangahco/pmis-system-config.git
```

## 2. Fetch Dependencies

Go inside the new folder (pmis-console) and execute these commands from a console:

```
$ npm install
$ git submodule update
$ node_modules/bower-installer/bower-installer.js
```

``npm install`` will install the necessary modules, ``bower`` and ``bower-installer``
and will prepare the root folder with necessary dependencies.

``git submodule update`` will retrieve some AngularJS commons libraries from our git repository
used by this application.

The following folders will be created under the root folder:

- node_modules (*only development*)
  > Used in order to run bower, but not required in production.

- bower_components (*only development*)
  > Used by bower to take libraries, used only when you prepare the folder, not required to run the application.

- libs
  > Contains the libraries required by the application (jquery,bootstrap,angular).

## 3. Build the Source for Testing

You can test the code typing on a terminal the following command, in order to build the javascript files,
then make sure you go on the next point to start it:

```
> npm run build
```

A new `build` folder will be created with files ready to be executed for testing.

## 4. Test the code

You can try the code with the `npm start` job, as soon as you execute the following command
a new server will start on default port 8080.

```
> npm start
```

## 5. Publish the Source

When you are ready for production prepare the code with the following command.
A full build will be prepared with minified version of all the javascript files ready for production.

```
> npm run publish
```

A new `dist` folder will be created with all the source required for production.