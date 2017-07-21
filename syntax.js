/**
 *
 * Microlibrary for language detection and syntax highlighting Gitweb blobs
 * @author Nickolas Burr <nickolasburr@gmail.com>
 *
 */

(function ($) {
	'use strict';

	var SHEBANG = '#!';

	// primary file types by language
	var LANG_PRIMARY_FILE_TYPES = {
		bash:       'sh',
	  c:          'c',
	  cpp:        'cpp',
	  cs:         'cs',
	  css:        'css',
	  javascript: 'js',
	  go:         'go',
	  html:       'html',
	  markdown:   'md',
	  php:        'php',
	  perl:       'pl',
	  python:     'py',
	  ruby:       'rb',
	  sql:        'sql',
	  typescript: 'ts',
	  xml:        'xml',
	  yaml:       'yml'
	},
	// file type synonyms
	LANG_FILE_TYPE_SYNONYMS = {
		bash:       ['bash', 'csh', 'ksh', 'zsh'],
	  c:          ['h'],
	  html:       ['htm', 'dhtml', 'xhtml'],
	  javascript: ['jse', 'json'],
	  markdown:   ['markdown'],
	  perl:       ['cgi', 'perl'],
	  php:        ['php5', 'phar', 'phtml'],
	  python:     ['pyc'],
	  ruby:       ['erb']
	},
	// file type associations, identified by the
	// primary file type of the associate members
	FILE_TYPE_ASSOCS = {
	  html:       ['css', 'js', 'php'],
	  json:       ['js'],
	  javascript: ['css', 'html', 'json', 'php'],
	  php:        ['css', 'html', 'js']
	},
	EXEC_LANG_NAMES = [
	  'bash',
	  'c',
	  'cpp',
	  'cs',
	  'go',
	  'perl',
	  'php',
	  'python',
	  'ruby'
	],
	EXEC_LANG_FILE_TYPES = {
	  bash:   'bash',
	  perl:   'pl',
	  php:    'php',
	  python: 'py',
	  ruby:   'rb',
	  sh:     'bash'
	};

	/**
	 * Utility methods
	 */

	var Utils = {};

	// get primitive type of `arg`
	Utils.getType = function (arg) {
		return (typeof arg);
	};

	// coerce `value` to string
	Utils.toString = function (value) {
		return ('' + value);
	};

	// coerce `value` to number
	Utils.toNumber = function (value) {
		return +(value);
	};

	// coerce `value` to boolean
	Utils.toBool = function (value) {
		return !!(value);
	};

	// coerce `value` to array
	Utils.toArray = function (value, sep) {
		sep = sep || '';
		if (this.getType(value) !== 'string' && this.getType(value) !== 'number') {
			throw new TypeError('`Utils.toArray` -> `value` must be a string or number, not ' + this.getType(value));
		}
		return this.toString(value).split(sep);
	};

	/**
	 * determine if `obj` is of type 'object'
	 *
	 * @note this is a *very* loose check on the type 'object', e.g.
	 * this will return true for an object literal, object instance,
	 * array literal, array instance, HTMLElement, and so on...
	 */
	Utils.isObject = function (obj) {
		return this.toBool(obj instanceof Object);
	};

	/**
	 * determine if `obj` is an object constructed from the native
	 * 'Object' prototype and not a different type of object constructor
	 */
	Utils.isNativeObject = function (obj) {
		return this.toBool(this.isObject(obj) && Object.getPrototypeOf(obj).constructor.name === 'Object');
	};

	// determine if object is empty or not
	Utils.isObjectEmpty = function (obj) {
		if (!this.isObject(obj)) {
			throw new TypeError('`Utils.isObjectEmpty` -> `obj` must be an object, not ' + this.getType(obj));
		}
		return !Object.keys(obj).length;
	};

	// determine if `arr` is an Array
	Utils.isArray = function (arr) {
		return this.toBool(arr instanceof Array);
	};

	// determine if `needle` is in `haystack`
	Utils.inArray = function (needle, haystack) {
		if (!this.isArray(haystack)) {
			throw new TypeError('`Utils.inArray` -> `haystack` must be an array, not ' + this.getType(haystack));
		}
		return this.toBool(haystack.indexOf(needle) > -1);
	};

	// determine if `element` is a valid HTMLElement object
	Utils.isElement = function (element) {
		return this.toBool(element instanceof HTMLElement);
	};

	// determine if `func` is a Function
	Utils.isFunction = function (func) {
		return this.toBool(this.getType(func) === 'function' && func instanceof Function);
	};

	// determine if `arg` is a scalar type
	Utils.isScalar = function (arg) {
		var stypes = [
			'string', 'number', 'boolean'
		];
		return this.inArray(this.getType(arg), stypes);
	};

	// determine if `arg` is a composite type
	Utils.isComposite = function (arg) {
		var ctypes = [
			'object', 'symbol', 'undefined'
		];
		return this.inArray(this.getType(arg), ctypes);
	};

	// get keys from object
	Utils.getKeys = function (obj) {
		if (!this.isObject(obj)) {
			throw new TypeError('`Utils.getKeys` -> `obj` must be an object, not ' + this.getType(obj));
		}
		return Object.keys(obj);
	};

	// get values from object
	Utils.getValues = function (obj) {
		if (!this.isObject(obj)) {
			throw new TypeError('`Utils.getValues` -> `obj` must be an object, not ' + this.getType(obj));
		}
		return Object.values(obj);
	};

	// get last index (as number) of `arr`
	Utils.getLastIndex = function (arr) {
		if (!this.isArray(arr)) {
			throw new TypeError('`Utils.getLastIndex` -> `arr` must be an array, not ' + this.getType(arr));
		}
		return this.toNumber(arr.length > 0 ? arr.length - 1 : 0);
	};

	/**
	 * Syntax methods
	 */

	var Syntax = Object.create(Utils);

	// _DOMContentLoaded_ event handler
	Syntax.onReady = function () {
		// query string Gitweb uses for processing
		var queryString = document.location.search,
		    isFileBlob  = this.isFileBlob(queryString);
		// if there isn't a query string (i.e. home page), simply return
		if (!(queryString && isFileBlob)) {
			return;
		}
		// otherwise, highlight the file syntax
		return this.highlightSyntax(queryString);
	};

	// determine if the current page is a file blob
	Syntax.isFileBlob = function (queryString) {
		return this.toBool(this.getLastIndex(this.toArray(queryString, ';a=blob')));
	};

	// get file type associations
	Syntax.getFileTypeAssocs = function (fileType) {
		// will hold an array of strings representing file types
		var fileTypes = [];
		// object keys from `FILE_TYPE_ASSOCS`
		var keys = this.getKeys(FILE_TYPE_ASSOCS);
		// push `fileType` onto `fileTypes` array
		fileTypes.push(fileType);
		// if `fileType` isn't a key found in `FILE_TYPE_ASSOCS`,
		// just return `fileTypes` array
		if (!this.inArray(fileType, keys)) {
			return fileTypes;
		}
		// concat `fileTypes` with array of associated file types,
		// and return the corresponding array of associated file types
		return fileTypes.concat(FILE_TYPE_ASSOCS[fileType]);
	};

	// get the primary file type from a synonym
	Syntax.getPrimaryFileType = function (fileType) {
		// object keys from `LANG_FILE_TYPE_SYNONYMS`
		var keys   = this.getKeys(LANG_FILE_TYPE_SYNONYMS),
		    length = keys.length;
		// check known synonyms against `fileType`
		for (var i = 0; i < length; i += 1) {
			var thisKey  = keys[i],
			    synonyms = LANG_FILE_TYPE_SYNONYMS[thisKey];
			// if `fileType` is found in synonyms array, return the key (primary file type)
			if (this.inArray(fileType, synonyms)) {
				return thisKey;
			}
		}
		return null;
	};

	// determine if file type is synonym (or can be applied to) by another file type
	Syntax.isFileTypeSynonym = function (fileType) {
		// object keys from `LANG_FILE_TYPE_SYNONYMS`
		var keys   = this.getKeys(LANG_FILE_TYPE_SYNONYMS),
		    length = keys.length;
		// loop through `keys` array
		for (var i = 0; i < length; i += 1) {
			var thisKey  = keys[i],
			    synonyms = LANG_FILE_TYPE_SYNONYMS[thisKey];
			// if `fileType` is a synonym, return true
			if (synonyms.indexOf(fileType) !== -1) {
				return true;
			}
		}
		// otherwise, return false
		return false;
	};

	// get executable type (.e.g 'perl' from /usr/bin/perl or /usr/bin/env perl)
	Syntax.getExecutableType = function () {
		// first source line of code `<div class="pre">`
		var fslocWrap   = $('.page_body .pre')[0],
		    fslocText   = $(fslocWrap).text(),
		    targetPath  = this.toArray(fslocText, SHEBANG)[1],
		    components  = this.toArray(targetPath, '/'),
		    executable  = components[this.getLastIndex(components)],
		    flagOptions = this.toArray(executable, new RegExp(/\s/)),
		    hasOptions  = this.toBool(this.getLastIndex(flagOptions));
		// if the declaration does not have any flag options given (e.g. '/bin/bash'),
		// `executable` will hold the string value of the executable name (e.g. 'bash')
		if (!hasOptions && this.inArray(executable, LANG_NAMES)) {
			return executable;
		}
		// if the declaration does have flag options specified and the target executable
		// is part of the declaration absolute path (e.g. '/usr/bin/perl -w'), `executable`
		// will be the string value of the executable name and its options (e.g. 'perl -w'),
		// `flagOptions` will be an array of strings, split from `executable` (e.g. ['perl', '-w']),
		// and `flagOptions[0]` will hold the value of the target executable (e.g. 'perl')
		if (hasOptions && this.inArray(flagOptions[0], LANG_NAMES)) {
			return flagOptions[0];
		}
		// if the declaration does have flag options specified and the target executable is *not*
		// part of the declaration absolute path (e.g. '/usr/bin/env python -c'), `executable`
		// will be the string value of the executable name and its options (e.g. 'env python -c'),
		// `flagOptions` will be an array of strings, split from `executable` (e.g. ['env', 'python', '-c']),
		// and `flagOptions[1]` will hold the value of the target executable (e.g. 'python')
		if (hasOptions && this.inArray(flagOptions[1], LANG_NAMES)) {
			return flagOptions[1];
		}
		return null;
	};

	// check the source code for a executable declaration (e.g. /usr/bin/strace)
	Syntax.isExecutable = function () {
		// first source line of code `<div class="pre">`
		var fslocWrap = $('.page_body .pre')[0],
		    fslocText = $(fslocWrap).text(),
		    lastIndex = this.getLastIndex(this.toArray(fslocText, SHEBANG));
		return this.toBool(lastIndex);
	};

	// determine if file type is valid based on extension or content
	Syntax.isFileTypeValid = function (fileType) {
		var isFileTypeValid = true;
		if (this.inArray(fileType, LANG_PRIMARY_FILE_TYPES)) {
			return true;
		}
		if (this.isFileTypeSynonym(fileType)) {
			return true;
		}
		if (this.isExecutable() && this.getExecutableType()) {
			return true;
		}
		return false;
	};

	// highlight file syntax
	Syntax.highlightSyntax = function (queryString) {
		var queryParams = this.toArray(queryString, ';f='),
		    lastIndex   = this.getLastIndex(queryParams);
		// if `;f=` does not exist within the query string, return early
		// => this should always be true when reaching this point,
		//    but to be absolutely certain, check it once more
		if (!this.toBool(lastIndex)) {
			return;
		}
		var pathName = this.toArray(this.toArray(queryParams[1], ';')[0], '/'),
		    fileName = this.toArray(pathName[this.getLastIndex(pathName)], '.'),
		    fileType = fileName[this.getLastIndex(fileName)];
		// if `fileType` is not a valid file type (or synonym), simply return
		if (!this.isFileTypeValid(fileType)) {
			return;
		}
		// if `fileType` turns out to be a synonym and not a primary file type,
		// get the primary file type instead; otherwise, make no change
		fileType = this.isExecutable()
		         ? EXEC_LANG_FILE_TYPES[this.getExecutableType()]
		         : !(this.inArray(fileType, LANG_PRIMARY_FILE_TYPES))
		         ? this.getPrimaryFileType(fileType)
		         : fileType;
		// configure highlight settings to replace tabs (for improved viewing),
		// and restrict highlighting to the language(s) associated with `fileType`
		hljs.configure({
			tabReplace: '  ',
			languages: this.getFileTypeAssocs(fileType)
		});
		// highlight `<div class="pre">` blocks instead of default `<pre><code>` blocks
		$('div.pre').each(function (index, block) {
			// highlight the given block
			hljs.highlightBlock(block);
		});
		// reset the line numbers back to default color
		$('.linenr').each(function (index, element) {
			$(element).css('color', '#4183c4');
			// including child nodes
			if ($(element).has('.hljs-number')) {
				$(element).find('.hljs-number').css('color', '#4183c4');
			}
		});
	};

	var onReady = Syntax.onReady.bind(Syntax);
	// attach _DOMContentLoaded_ event listener
	$(document).ready(onReady);
}).call(this, jQuery);
