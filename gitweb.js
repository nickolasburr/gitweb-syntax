/**
 *
 * gitweb.js: Basic language detection and syntax highlighting Gitweb blobs.
 *
 * @author Nickolas Burr <nickolasburr@gmail.com>
 *
 */

(function ($) {
    'use strict';

    var SHEBANG = '#!';

    /**
     * Primary file types by language.
     */
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
    };

    /**
     * File type synonyms.
     */
    var LANG_FILE_TYPE_SYNONYMS = {
        bash:       ['bash', 'csh', 'ksh', 'zsh'],
        c:          ['h'],
        html:       ['htm', 'dhtml', 'xhtml'],
        javascript: ['jse', 'json'],
        markdown:   ['markdown'],
        perl:       ['cgi', 'perl'],
        php:        ['php5', 'phar', 'phtml'],
        python:     ['pyc'],
        ruby:       ['erb']
    };

    /**
     * file type associations, identified by the
     * primary file type of the associate members
     */
    var FILE_TYPE_ASSOCS = {
        html:       ['css', 'js', 'php'],
        json:       ['js'],
        javascript: ['css', 'html', 'json', 'php'],
        php:        ['css', 'html', 'js']
    };

    /**
     * Supported languages commonly used as runtime
     * for executables, identified by shebang path.
     */
    var EXEC_LANG_NAMES = [
        'bash',
        'c',
        'cpp',
        'cs',
        'go',
        'perl',
        'php',
        'python',
        'ruby'
    ];

    var EXEC_LANG_FILE_TYPES = {
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

    /**
     * Get type of `arg`.
     *
     * @param {mixed} arg
     * @return {string}
     */
    Utils.getType = function (arg) {
        return (typeof arg);
    };

    /**
     * Coerce `value` to string.
     *
     * @param {mixed} value
     * @return {string}
     */
    Utils.toString = function (value) {
        return ('' + value);
    };

    /**
     * Coerce `value` to number.
     *
     * @param {scalar} value
     * @return {int}
     */
    Utils.toNumber = function (value) {
        return +(value);
    };

    /**
     * Coerce `value` to boolean.
     *
     * @param {scalar} value
     * @return bool
     */
    Utils.toBool = function (value) {
        return !!(value);
    };

    /**
     * Coerce `value` to array.
     *
     * @param {scalar} value
     * @param {string} delimiter
     * @return {array}
     */
    Utils.toArray = function (value, delimiter) {
        delimiter = delimiter || '';

        if (this.getType(value) !== 'string' && this.getType(value) !== 'number') {
            throw new TypeError('[Utils.toArray]: `value` must be a string or number, not ' + this.getType(value));
        }

        return this.toString(value).split(delimiter);
    };

    /**
     * Determine if `obj` is of type 'object'.
     *
     * @param {mixed} obj
     * @return {bool}
     * @note This is a *very* loose check on the type 'object',
     *       e.g. this will return true for an object literal,
     *       Object instance, array literal, Array instance,
     *       HTMLElement, Node, and so on.
     */
    Utils.isObject = function (obj) {
        return this.toBool(obj instanceof Object);
    };

    /**
     * Determine if `obj` is an object constructed from the
     * native 'Object' prototype, and not from a different
     * type of object constructor.
     *
     * @param {object} obj
     * @return {bool}
     */
    Utils.isNativeObject = function (obj) {
        return this.toBool(this.isObject(obj) && Object.getPrototypeOf(obj).constructor.name === 'Object');
    };

    /**
     * Determine if object is empty or not.
     *
     * @param {object} obj
     * @return {bool}
     */
    Utils.isObjectEmpty = function (obj) {
        if (!this.isObject(obj)) {
            throw new TypeError('[Utils.isObjectEmpty]: `obj` must be an object, not ' + this.getType(obj));
        }

        return !Object.keys(obj).length;
    };

    /**
     * Determine if `arr` is an Array.
     *
     * @param {mixed} arr
     * @return {bool}
     */
    Utils.isArray = function (arr) {
        return this.toBool(arr instanceof Array);
    };

    /**
     * Determine if `needle` is in `haystack`.
     *
     * @param {string} needle
     * @param {array} haystack
     * @return {bool}
     */
    Utils.inArray = function (needle, haystack) {
        if (!this.isArray(haystack)) {
            throw new TypeError('[Utils.inArray]: `haystack` must be an array, not ' + this.getType(haystack));
        }

        return this.toBool(haystack.indexOf(needle) > -1);
    };

    /**
     * Determine if `element` is a valid HTMLElement object.
     *
     * @param {mixed} element
     * @return {bool}
     */
    Utils.isElement = function (element) {
        return this.toBool(element instanceof HTMLElement);
    };

    /**
     * Determine if `func` is a Function.
     *
     * @param {mixed} func
     * @return {bool}
     */
    Utils.isFunction = function (func) {
        return this.toBool(this.getType(func) === 'function' && func instanceof Function);
    };

    /**
     * Determine if `arg` is a scalar type.
     *
     * @param {mixed} arg
     * @return {bool}
     */
    Utils.isScalar = function (arg) {
        var scalarTypes = [
            'string',
            'number',
            'boolean'
        ];

        return this.inArray(this.getType(arg), scalarTypes);
    };

    /**
     * Determine if `arg` is a composite type.
     *
     * @param {mixed} arg
     * @return {bool}
     */
    Utils.isComposite = function (arg) {
        var compositeTypes = [
            'object',
            'symbol',
            'undefined'
        ];

        return this.inArray(this.getType(arg), compositeTypes);
    };

    /**
     * Get keys from object.
     *
     * @param {object} obj
     * @return {array}
     */
    Utils.getKeys = function (obj) {
        if (!this.isObject(obj)) {
            throw new TypeError('[Utils.getKeys]: `obj` must be an object, not ' + this.getType(obj));
        }

        return Object.keys(obj);
    };

    /**
     * Get values from object.
     *
     * @param {object} obj
     * @return {array}
     */
    Utils.getValues = function (obj) {
        if (!this.isObject(obj)) {
            throw new TypeError('[Utils.getValues]: `obj` must be an object, not ' + this.getType(obj));
        }

        return Object.values(obj);
    };

    /**
     * Get last index (as number) of `arr`.
     *
     * @param {array} arr
     * @return {int}
     */
    Utils.getLastIndex = function (arr) {
        if (!this.isArray(arr)) {
            throw new TypeError('[Utils.getLastIndex]: `arr` must be an array, not ' + this.getType(arr));
        }

        return this.toNumber(arr.length > 0 ? arr.length - 1 : 0);
    };

    /**
     * Syntax methods
     */
    var Syntax = Object.create(Utils);

    /**
     * DOMContentLoaded event handler.
     *
     * @return {void}
     */
    Syntax.onReady = function () {
        /** Query string Gitweb uses for processing. */
        var queryString = document.location.search,
            isFileBlob  = this.isFileBlob(queryString);

        /** If there isn't a query string (e.g. home page), simply return. */
        if (!(queryString && isFileBlob)) {
            return;
        }

        /** Otherwise, highlight file syntax. */
        return this.highlightSyntax(queryString);
    };

    /**
     * Determine if the current page is a file blob.
     *
     * @param {string} queryString
     * @return {bool}
     */
    Syntax.isFileBlob = function (queryString) {
        return this.toBool(this.getLastIndex(this.toArray(queryString, ';a=blob')));
    };

    /**
     * Get file type associations.
     *
     * @param {string} fileType
     * @return {array}
     */
    Syntax.getFileTypeAssocs = function (fileType) {
        /** @var {array} fileTypes */
        var fileTypes = [];

        /** @var {array} keys */
        var keys = this.getKeys(FILE_TYPE_ASSOCS);

        fileTypes.push(fileType);

        /**
         * If `fileType` isn't a key found in `FILE_TYPE_ASSOCS`,
         * just return `fileTypes` array.
         */
        if (!this.inArray(fileType, keys)) {
            return fileTypes;
        }

        /**
         * Otherwise, concatenate `fileTypes` with array of associated file types,
         * and return the corresponding array of associated file types.
         */
        return fileTypes.concat(FILE_TYPE_ASSOCS[fileType]);
    };

    /**
     * Get the primary file type from a synonym.
     *
     * @param {string} fileType
     * @return {string|null}
     */
    Syntax.getPrimaryFileType = function (fileType) {
        /** @var {array} keys */
        var keys = this.getKeys(LANG_FILE_TYPE_SYNONYMS);

        /** @var {int} length */
        var length = keys.length;

        /** Check known synonyms against `fileType`. */
        for (var i = 0; i < length; i += 1) {
            /** @var {string} thisKey */
            var thisKey  = keys[i];

            /** @var {array} synonyms */
            var synonyms = LANG_FILE_TYPE_SYNONYMS[thisKey];

            /**
             * If `fileType` is found in synonyms array,
             * return the key (primary file type).
             */
            if (this.inArray(fileType, synonyms)) {
                return thisKey;
            }
        }

        return null;
    };

    /**
     * Determine if file type is synonym (or can be applied to) by another file type.
     *
     * @param {string} fileType
     * @return {bool}
     */
    Syntax.isFileTypeSynonym = function (fileType) {
        /** @var {array} keys */
        var keys = this.getKeys(LANG_FILE_TYPE_SYNONYMS);

        /** @var {int} length */
        var length = keys.length;

        for (var i = 0; i < length; i += 1) {
            var thisKey  = keys[i],
                synonyms = LANG_FILE_TYPE_SYNONYMS[thisKey];

            /** Match if `fileType` is synonym. */
            if (synonyms.indexOf(fileType) !== -1) {
                return true;
            }
        }

        return false;
    };

    /**
     * Get executable type (e.g. 'perl' from /usr/bin/perl or /usr/bin/env perl).
     *
     * @return {string|null}
     */
    Syntax.getExecutableType = function () {
        /** @var {HTMLElement} fslocWrap ~ First SLOC `<div class="pre">`. */
        var fslocWrap   = $('.page_body .pre')[0],
            fslocText   = $(fslocWrap).text(),
            targetPath  = this.toArray(fslocText, SHEBANG)[1],
            components  = this.toArray(targetPath, '/'),
            executable  = components[this.getLastIndex(components)],
            flagOptions = this.toArray(executable, new RegExp(/\s/)),
            hasOptions  = this.toBool(this.getLastIndex(flagOptions));

        /**
         * If the declaration does not have any flag options
         * given (e.g. '/bin/bash'), `executable` will hold
         * the string value of the executable name (e.g. 'bash').
         */
        if (!hasOptions && this.inArray(executable, LANG_NAMES)) {
            return executable;
        }

        /**
         * If the declaration does have flag options specified and
         * the target executable is part of the declaration absolute
         * path (e.g. '/usr/bin/perl -w'), `executable` will be the
         * string value of the executable name and its options (e.g. 'perl -w'),
         * `flagOptions` will be an array of strings, split from `executable`
         * (e.g. ['perl', '-w']), and `flagOptions[0]` will hold the value
         * of the target executable (e.g. 'perl').
         */
        if (hasOptions && this.inArray(flagOptions[0], LANG_NAMES)) {
            return flagOptions[0];
        }

        /**
         * If the declaration does have flag options specified and
         * the target executable is *not* part of the declaration
         * absolute path (e.g. '/usr/bin/env python -c'), `executable`
         * will be the string value of the executable name and its options
         * (e.g. 'env python -c'), `flagOptions` will be an array of strings,
         * split from `executable` (e.g. ['env', 'python', '-c']), and `flagOptions[1]`
         * will hold the value of the target executable (e.g. 'python').
         */
        if (hasOptions && this.inArray(flagOptions[1], LANG_NAMES)) {
            return flagOptions[1];
        }

        return null;
    };

    /**
     * Check source code for executable declaration (e.g. /usr/bin/strace).
     *
     * @return {bool}
     */
    Syntax.isExecutable = function () {
        /** @var {HTMLElement} fslocWrap ~ First SLOC `<div class="pre">` element. */
        var fslocWrap = $('.page_body .pre')[0],
            fslocText = $(fslocWrap).text(),
            lastIndex = this.getLastIndex(this.toArray(fslocText, SHEBANG));

        return this.toBool(lastIndex);
    };

    /**
     * Determine if file type is valid based on extension or content.
     *
     * @param {string} fileType
     * @return {bool}
     */
    Syntax.isFileTypeValid = function (fileType) {
        if (this.inArray(fileType, LANG_PRIMARY_FILE_TYPES) ||
            this.isFileTypeSynonym(fileType) ||
            (this.isExecutable() && this.getExecutableType())
        ) {
            return true;
        }

        return false;
    };

    /**
     * Highlight file syntax.
     *
     * @param {string} queryString
     * @return {void}
     */
    Syntax.highlightSyntax = function (queryString) {
        /** @var {array} queryParams */
        var queryParams = this.toArray(queryString, ';f=');

        /** @var {int} lastIndex */
        var lastIndex = this.getLastIndex(queryParams);

        /**
         * If `;f=` does not exist within the query string, return.
         * => This should always be true when reaching this point,
         *    but to be absolutely certain, check it once more.
         */
        if (!this.toBool(lastIndex)) {
            return;
        }

        var pathName = this.toArray(this.toArray(queryParams[1], ';')[0], '/'),
            fileName = this.toArray(pathName[this.getLastIndex(pathName)], '.'),
            fileType = fileName[this.getLastIndex(fileName)];

        /**
         * If `fileType` is not a valid file type (or synonym), return.
         */
        if (!this.isFileTypeValid(fileType)) {
            return;
        }

        /**
         * If `fileType` turns out to be a synonym and not a primary file type,
         * get the primary file type instead; otherwise, make no change.
         */
        fileType = this.isExecutable()
                 ? EXEC_LANG_FILE_TYPES[this.getExecutableType()]
                 : !(this.inArray(fileType, LANG_PRIMARY_FILE_TYPES))
                 ? this.getPrimaryFileType(fileType)
                 : fileType;

        /**
         * Configure highlight settings to replace tabs (for improved viewing),
         * and restrict highlighting to the language(s) associated with `fileType`.
         */
        hljs.configure({
            tabReplace: '  ',
            languages: this.getFileTypeAssocs(fileType)
        });

        /** Highlight `<div class="pre">` blocks instead of default `<pre><code>` blocks. */
        $('div.pre').each(function (index, block) {
            hljs.highlightBlock(block);
        });

        /** Reset the line numbers back to default color. */
        $('.linenr').each(function (index, element) {
            $(element).css('color', '#4183c4');

            /** Including child nodes. */
            if ($(element).has('.hljs-number')) {
                $(element).find('.hljs-number').css('color', '#4183c4');
            }
        });
    };

    /** Attach DOMContentLoaded event listener. */
    $(document).ready(Syntax.onReady.bind(Syntax));
}).call(this, jQuery);
