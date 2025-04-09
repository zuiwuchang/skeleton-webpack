# skeleton-webpack
Project skeleton for front-end development using webpack

Sometimes you want to write some simple html pages, but using angular/react/vue seems too bloated, and writing html+javascript+css directly seems too primitive and inefficient. Clone this project and start writing your web!

This project integrates a set of quick-start and simple web development skeleton, which is very suitable for quickly writing some small and interesting projects

# Quick Start

Fork and clone the project to your local machine

```
git clone https://github.com/zuiwuchang/skeleton-webpack.git
```

Install project dependencies
```
cd skeleton-webpack && npm install
```

Running the Development Server
```
npm run dev
```
> The above command will run a server on port 127.0.0.1:4000, which will automatically compile and return the web page code every time it receives a request.

Modify your webpage source code and view the modified results immediately by refreshing the browser (server.js will automatically compile the source code for requests after the source code is modified)

After completing all coding, execute the following directory to compile the project

```
npm run build
```
> The compiled web page code is stored in the dist folder, and all html/js/css have been minimized.

# Project Structure

* **server.js** A server used during development that automatically compiles source code for web page requests during development
* **tsconfig.json** Typescript configuration file, I recommend using typescript instead of javascript, because javascript is too prone to accidental errors, using the typescript compiler will help you avoid these problems
* **webpack.config.js** webpack configuration file, used for final compilation of the project
* **webpack.helper.js** Usually you don't need to worry about it, it implements some common functions for server.js and webpack.config.js
* **package.json** npm project definition, please modify the information in it to your project information
* **dist** default output folder
* **style.scss** Write the common CSS for all pages here. By default, it only imports [bulma.min.css](https://bulma.io/)
* **template** This is where you should write your [art](https://goofychris.github.io/art-template/) sub-template and your typescript sub-module
* **src** Default source code storage location. All HTML files below it will be treated as a page
  * **assets** Static content will not be compiled
  * **main.ts** Alpine initialization is executed. You can add common code in it. By default, all pages will load this script
  * **\*.html** Each html will be rendered into an html page using [art](https://goofychris.github.io/art-template/)
    * **\*.js** Each html file can have a js file with the same name, and the module.exports in the js file will be passed in as data for [art](https://goofychris.github.io/art-template/) rendering.
