README v1.2.0 / 01 APRIL 2016

# Thr0w Server

## Introduction

The Thr0w Project is about building inexpensive and manageable interactive (or
not) video walls using commodity hardware, web technologies, and open source
software. The key to this solution is having one computer behind each screen
networked to a single computer acting as a server. With this design, the
splitting and synchronization of content is accomplished through software.

This repository provides the project's Thr0w Server that supports the
Thr0w (Client) API available at:

https://github.com/larkintuckerllc/thr0w-client

## Installation

Install Node.js (Linux, Windows, or Mac OS X):

https://nodejs.org/en/

Download the latest version of the Thr0w Server:

https://github.com/larkintuckerllc/thr0w-server/releases

From the root folder of the download run the command:

```
npm install
```

Copy the *ROOT/config/default.json* to *ROOT/config/production.json*. In
*production.json* update the *secret* and *adminpassword* to a secure
password.

Starting the Thr0w Server consists of:

1. Set an environment variable *NODE_ENV* with *production*.
2. Set an environment variable *NODE_APP_INSTANCE* with *0*.
3. Change directory to the root folder.
4. Execute the command.

```
node index.js
```

To run the Thr0w Server in production, one can use a process manager such
as PM2.

https://github.com/Unitech/pm2

## Usage

While the Thr0w Server provides an API of it's own,
the primary method of using the server is to use
one of:

* Thr0w (Client) API: Chrome Web Browser
* Thr0w (Node.js) API: Node.js

**Thr0w (Client) API**

https://github.com/larkintuckerllc/thr0w-client

The Thr0w Server does provide the required *socket.io.js* JavaScript library
that is added to the HTML *body* of applications using the Thr0w (Client) API.

```
<script src="http://HOSTNAME:3001/socket.io/socket.io.js"></script>
```

where *HOSTNAME* is the hostname of the Thr0w Server, e.g., *localhost*
in the case of local development.

**Thr0w (Node.js) API**

https://github.com/larkintuckerllc/thr0w-api

## Contributing

Submit bug or enhancement requests using the Github *Issues* feature. Submit
bug fixes or enhancements as pull requests. Specifically, follow GitHub's
document *Contributing to Open Source on GitHub*.

<https://guides.github.com/activities/contributing-to-open-source/>

The JavaScript is to pass JSHint with the default configuration (with the
*node* environment). The JavaScript is to pass JSCS with the Google preset.

* <http://jshint.com/>
* <http://jscs.info/>

The JavaScript is to comply with the following style guide.

* Use named functions instead of passing an anonymous function in as a callback.
* Define functions in the scope where they are used.
* Place functions declarations at the end of the scope; rely on hoisting.

## Credits

TODO

## Contact

General questions and comments can be directed to <mailto:john@larkintuckerllc.com>.

## License

This project is licensed under GNU General Public License.
